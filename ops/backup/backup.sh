#!/usr/bin/env bash
# Sauvegarde couplée : un dump de la base ET les fichiers qu'il référence, pris au même moment,
# chiffrés, puis envoyés dans la zone Bunny de sauvegarde.
#
#   db/amame-<horodatage UTC>.dump.gpg   dump « pg_dump -Fc », conservé BACKUP_DB_RETENTION_DAYS jours
#   files/<clé>.gpg                      copie des fichiers uploadés, en ajout seul
#
# Les clés des fichiers sont immuables (UUID) et la copie ne supprime jamais rien :
# tout dump conservé retrouve donc ses fichiers.

. /usr/local/bin/lib.sh

require_env BACKUP_DATABASE_URL BACKUP_PASSPHRASE BUNNY_BACKUP_ZONE BUNNY_BACKUP_ZONE_KEY
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"
BACKUP_DB_RETENTION_DAYS="${BACKUP_DB_RETENTION_DAYS:-30}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

# Copie vers files/ les fichiers du dossier des uploads absents de la sauvegarde.
copy_new_files() {
  local key copied=0
  if [ ! -d "$UPLOADS_DIR" ]; then
    log "fichiers : dossier $UPLOADS_DIR absent, copie ignorée"
    return 0
  fi
  bunny_list_recursive "files/uploads" | sed -e 's|^files/||' -e 's|\.gpg$||' | sort > "$work/remote.txt"
  (cd "$UPLOADS_DIR" && find . -type f -printf 'uploads/%P\n') | sort > "$work/local.txt"
  if [ ! -s "$work/local.txt" ]; then
    # Un chemin d'hôte erroné donne un dossier vide, que Docker crée sans rien dire
    log "ATTENTION : aucun fichier dans $UPLOADS_DIR — vérifier UPLOADS_HOST_PATH"
  fi
  comm -23 "$work/local.txt" "$work/remote.txt" > "$work/todo.txt"
  while IFS= read -r key; do
    encrypt_file "$UPLOADS_DIR/${key#uploads/}" "$work/object.gpg"
    bunny_put "$work/object.gpg" "files/$key.gpg"
    copied=$((copied + 1))
  done < "$work/todo.txt"
  log "fichiers : $(wc -l < "$work/local.txt") sur le disque, $copied nouveau(x) copié(s)"
}

# Supprime les dumps plus anciens que la durée de conservation. Ne touche jamais à files/.
prune_old_dumps() {
  local listing cutoff is_dir name _size
  cutoff="amame-$(date -u -d "-${BACKUP_DB_RETENTION_DAYS} days" +%Y%m%dT%H%M%SZ).dump.gpg"
  listing="$(bunny_list db)"
  [ -n "$listing" ] || return 0
  while IFS=$'\t' read -r is_dir name _size; do
    [ "$is_dir" = "false" ] || continue
    [[ "$name" =~ ^amame-[0-9]{8}T[0-9]{6}Z\.dump\.gpg$ ]] || continue
    if [[ "$name" < "$cutoff" ]]; then
      bunny_delete "db/$name"
      log "dump expiré supprimé : db/$name"
    fi
  done <<<"$listing"
}

log "sauvegarde couplée $stamp : début"

# Les fichiers sont copiés avant ET après le dump : un fichier remplacé ou ajouté
# pendant l'opération reste ainsi couvert par le dump pris entre les deux passes.
copy_new_files

pg_dump --format=custom --file="$work/db.dump" "$BACKUP_DATABASE_URL"
encrypt_file "$work/db.dump" "$work/db.dump.gpg"
bunny_put "$work/db.dump.gpg" "db/amame-$stamp.dump.gpg"
log "base : db/amame-$stamp.dump.gpg envoyé ($(stat -c %s "$work/db.dump") octets avant chiffrement)"

copy_new_files
prune_old_dumps

log "sauvegarde couplée $stamp : terminée"
