#!/usr/bin/env bash
# Fonctions communes aux scripts d'exploitation de la stack « amame-ops ».
# Bunny Storage est utilisé par son API HTTP native ; rien n'est écrit en dehors de la zone de sauvegarde.

set -euo pipefail
export LC_ALL=C

log()  { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
fail() { log "ERREUR : $*" >&2; exit 1; }

require_env() {
  local name
  for name in "$@"; do
    [ -n "${!name:-}" ] || fail "variable $name non définie"
  done
}

BUNNY_STORAGE_ENDPOINT="${BUNNY_STORAGE_ENDPOINT:-https://storage.bunnycdn.com}"

# ── Chiffrement ───────────────────────────────────────────────────────────────
# La phrase de chiffrement passe par un descripteur de fichier, jamais par la ligne de commande.
export GNUPGHOME="${GNUPGHOME:-/tmp/gnupg}"
mkdir -p "$GNUPGHOME"
chmod 700 "$GNUPGHOME"

encrypt_file() {  # encrypt_file <fichier en clair> <fichier chiffré>
  gpg --batch --yes --quiet --no-symkey-cache --pinentry-mode loopback --passphrase-fd 3 \
      --symmetric --cipher-algo AES256 --output "$2" "$1" 3<<<"$BACKUP_PASSPHRASE"
}

decrypt_file() {  # decrypt_file <fichier chiffré> <fichier en clair>
  gpg --batch --yes --quiet --no-symkey-cache --pinentry-mode loopback --passphrase-fd 3 \
      --decrypt --output "$2" "$1" 3<<<"$BACKUP_PASSPHRASE"
}

# ── Bunny Storage (zone de sauvegarde) ────────────────────────────────────────
# Encode chaque segment d'un chemin pour une URL, en conservant les « / ».
urlencode_path() {
  jq -rn --arg p "$1" '$p | split("/") | map(@uri) | join("/")'
}

bunny_url() {
  printf '%s/%s/%s' "${BUNNY_STORAGE_ENDPOINT%/}" "$BUNNY_BACKUP_ZONE" "$(urlencode_path "$1")"
}

# La clé de la zone passe par un fichier de configuration curl, pas par la ligne de commande.
bunny_curl() {
  curl --silent --show-error --retry 3 --retry-delay 5 --connect-timeout 15 \
       -K <(printf 'header = "AccessKey: %s"\n' "$BUNNY_BACKUP_ZONE_KEY") "$@"
}

# L'empreinte SHA-256 accompagne l'envoi : Bunny refuse un contenu qui ne lui correspond pas.
bunny_put() {  # bunny_put <fichier local> <chemin distant>
  local sum
  sum="$(sha256sum "$1" | cut -d' ' -f1 | tr 'a-f' 'A-F')"
  bunny_curl --fail -H "Checksum: $sum" -H "Content-Type: application/octet-stream" \
             --upload-file "$1" "$(bunny_url "$2")" >/dev/null
}

bunny_get() {  # bunny_get <chemin distant> <fichier local>
  bunny_curl --fail --output "$2" "$(bunny_url "$1")"
}

bunny_delete() {  # bunny_delete <chemin distant>
  bunny_curl --fail -X DELETE "$(bunny_url "$1")" >/dev/null
}

# Liste un dossier distant, sans descendre dans les sous-dossiers.
# Une ligne par objet : <true|false si dossier> TAB <nom> TAB <taille>. Un dossier absent donne une liste vide.
bunny_list() {  # bunny_list <dossier distant>
  local body code
  body="$(mktemp)"
  code="$(bunny_curl --output "$body" --write-out '%{http_code}' -H 'Accept: application/json' \
                     "$(bunny_url "${1%/}")/")" || code="000"
  case "$code" in
    200) jq -r '.[] | [(.IsDirectory | tostring), .ObjectName, (.Length | tostring)] | @tsv' "$body" ;;
    404) ;;
    *)   rm -f "$body"; fail "listing de « $1 » impossible (HTTP $code)" ;;
  esac
  rm -f "$body"
}

# Liste récursive : affiche le chemin complet de chaque fichier sous <dossier distant>.
bunny_list_recursive() {  # bunny_list_recursive <dossier distant>
  local dir="${1%/}" listing is_dir name _size
  listing="$(bunny_list "$dir")"
  [ -n "$listing" ] || return 0
  while IFS=$'\t' read -r is_dir name _size; do
    if [ "$is_dir" = "true" ]; then
      bunny_list_recursive "$dir/$name"
    else
      printf '%s\n' "$dir/$name"
    fi
  done <<<"$listing"
}
