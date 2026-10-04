#!/usr/bin/env bash
# Récupère des fichiers depuis la zone de sauvegarde, déchiffrés, dans un dossier local.
# Ne remplace jamais un fichier déjà présent dans le dossier de destination.
#
#   restore-files.sh /tmp/restore                      tous les fichiers
#   restore-files.sh /tmp/restore uploads/utilisateur  seulement ce dossier
#   restore-files.sh /tmp/restore uploads/actualite/<uuid>.jpeg   un seul fichier
#
# Les fichiers arrivent sous <destination>/uploads/<dossier>/<nom>, comme sur le serveur.

. /usr/local/bin/lib.sh

require_env BACKUP_PASSPHRASE BUNNY_BACKUP_ZONE BUNNY_BACKUP_ZONE_KEY
[ "$#" -ge 1 ] || fail "usage : restore-files.sh <dossier de destination> [clé ou dossier, « uploads » par défaut]"
dest="${1%/}"
prefix="${2:-uploads}"
prefix="${prefix%/}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Un fichier précis, ou tout un dossier
if bunny_get "files/$prefix.gpg" "$work/probe.gpg" 2>/dev/null; then
  printf '%s\n' "$prefix" > "$work/keys.txt"
else
  bunny_list_recursive "files/$prefix" | sed -e 's|^files/||' -e 's|\.gpg$||' | sort > "$work/keys.txt"
fi
[ -s "$work/keys.txt" ] || fail "rien à restaurer sous « $prefix »"

restored=0
skipped=0
while IFS= read -r key; do
  if [ -e "$dest/$key" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  mkdir -p "$(dirname "$dest/$key")"
  bunny_get "files/$key.gpg" "$work/object.gpg"
  decrypt_file "$work/object.gpg" "$dest/$key"
  restored=$((restored + 1))
done < "$work/keys.txt"

log "restauration des fichiers : $restored récupéré(s) dans $dest, $skipped déjà présent(s) laissé(s) en place"
