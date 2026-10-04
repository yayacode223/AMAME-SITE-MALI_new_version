#!/usr/bin/env bash
# Restaure un dump de la zone de sauvegarde dans une base PostgreSQL.
# REMPLACE le contenu de la base cible. Celle-ci est toujours désignée explicitement :
# il n'y a pas de valeur par défaut, pour qu'une restauration ne puisse pas partir par erreur.
#
#   restore-db.sh                                   liste les dumps disponibles
#   restore-db.sh amame-20261003T023000Z.dump.gpg "postgresql://utilisateur:mot_de_passe@hote:5432/amame_db"
#
# Tout se fait dans une seule transaction : en cas d'erreur, la base cible reste telle qu'elle était.
# Avant de restaurer la production, arrêter le backend ; le redémarrer ensuite.

. /usr/local/bin/lib.sh

require_env BACKUP_PASSPHRASE BUNNY_BACKUP_ZONE BUNNY_BACKUP_ZONE_KEY

if [ "$#" -eq 0 ]; then
  listing="$(bunny_list db)"
  log "dumps disponibles dans db/ (du plus ancien au plus récent) :"
  awk -F'\t' '$1 == "false" && $2 ~ /^amame-[0-9TZ]+\.dump\.gpg$/ { print "  " $2 }' <<<"$listing" | sort
  exit 0
fi
[ "$#" -eq 2 ] || fail "usage : restore-db.sh <nom du dump> <URL de la base cible>"
dump_name="$1"
target="$2"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

log "téléchargement de db/$dump_name"
bunny_get "db/$dump_name" "$work/db.dump.gpg"
decrypt_file "$work/db.dump.gpg" "$work/db.dump"

log "restauration en cours : le contenu de la base cible est remplacé"
pg_restore --clean --if-exists --no-owner --no-acl --single-transaction --dbname="$target" "$work/db.dump"
log "restauration terminée"
