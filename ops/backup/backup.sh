#!/usr/bin/env bash
# Sauvegarde couplée : un dump de la base ET les fichiers qu'il référence, pris au même moment,
# chiffrés, puis envoyés dans la zone Bunny de sauvegarde.
#
#   db/amame-<horodatage UTC>.dump.gpg   dump « pg_dump -Fc », conservé BACKUP_DB_RETENTION_DAYS jours
#   files/<clé>.gpg                      copie des fichiers uploadés, en ajout seul
#
# Source des fichiers (BACKUP_FILES_SOURCE) : « disk », le dossier des uploads (défaut), jusqu'à la
# bascule vers Bunny ; « bunny » ensuite, les zones de l'application lues avec leurs mots de passe en
# lecture seule (BUNNY_PUBLIC_ZONE_READ_KEY, BUNNY_PRIVATE_ZONE_READ_KEY).
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

# Source des fichiers : le disque jusqu'à la bascule vers Bunny (étape 3.5), puis les zones Bunny.
copy_new_files() {
  case "${BACKUP_FILES_SOURCE:-disk}" in
    disk)  copy_new_files_from_disk ;;
    bunny) copy_new_files_from_bunny ;;
    *)     fail "BACKUP_FILES_SOURCE invalide : « $BACKUP_FILES_SOURCE ». Attendu : disk ou bunny" ;;
  esac
}

# Copie vers files/ les objets des zones Bunny absents de la sauvegarde (DT9), avec les mots de passe
# en lecture seule des zones. Chaque clé n'est lue que dans sa zone : uploads/utilisateur/ dans la
# zone privée, le reste dans la zone publique.
copy_new_files_from_bunny() {
  local kind zone keyvar key copied=0
  require_env BUNNY_PUBLIC_ZONE BUNNY_PRIVATE_ZONE
  require_env "$(read_key_var public)" "$(read_key_var private)"
  bunny_list_recursive "files/uploads" | sed -e 's|^files/||' -e 's|\.gpg$||' | sort > "$work/remote.txt"
  : > "$work/source.tsv"
  for kind in public private; do
    if [ "$kind" = public ]; then zone="$BUNNY_PUBLIC_ZONE"; else zone="$BUNNY_PRIVATE_ZONE"; fi
    keyvar="$(read_key_var "$kind")"
    # « if » et non « && » : sous set -e, un test faux en dernière itération ferait échouer la boucle.
    zone_list_recursive "$zone" "$keyvar" uploads | cut -f1 | while IFS= read -r key; do
      if [ "$(key_zone_kind "$key")" = "$kind" ]; then
        printf '%s\t%s\t%s\n' "$key" "$zone" "$keyvar"
      fi
    done >> "$work/source.tsv"
  done
  sort -t $'\t' -k1,1 "$work/source.tsv" -o "$work/source.tsv"
  if [ ! -s "$work/source.tsv" ]; then
    log "ATTENTION : aucun fichier dans les zones $BUNNY_PUBLIC_ZONE et $BUNNY_PRIVATE_ZONE — vérifier les variables"
  fi
  cut -f1 "$work/source.tsv" | comm -23 - "$work/remote.txt" > "$work/todo.txt"
  while IFS= read -r key; do
    IFS=$'\t' read -r _ zone keyvar < <(awk -F'\t' -v k="$key" '$1 == k { print; exit }' "$work/source.tsv")
    zone_curl "$keyvar" --fail --output "$work/object" "$(zone_url "$zone" "$key")"
    encrypt_file "$work/object" "$work/object.gpg"
    bunny_put "$work/object.gpg" "files/$key.gpg"
    copied=$((copied + 1))
  done < "$work/todo.txt"
  rm -f "$work/object" "$work/object.gpg"
  log "fichiers : $(wc -l < "$work/source.tsv") dans Bunny, $copied nouveau(x) copié(s)"
}

# Copie vers files/ les fichiers du dossier des uploads absents de la sauvegarde.
copy_new_files_from_disk() {
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
