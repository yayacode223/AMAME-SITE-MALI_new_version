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

# ── Bunny Storage : toute zone ────────────────────────────────────────────────
# Encode chaque segment d'un chemin pour une URL, en conservant les « / ».
urlencode_path() {
  jq -rn --arg p "$1" '$p | split("/") | map(@uri) | join("/")'
}

zone_url() {  # zone_url <zone> <chemin>
  printf '%s/%s/%s' "${BUNNY_STORAGE_ENDPOINT%/}" "$1" "$(urlencode_path "$2")"
}

# Le mot de passe de la zone, lu dans la variable nommée, passe par un fichier de configuration
# curl, jamais par la ligne de commande (invisible dans « ps »).
zone_curl() {  # zone_curl <nom de la variable du mot de passe> <arguments curl…>
  local keyvar="$1"
  shift
  curl --silent --show-error --retry 3 --retry-delay 5 --connect-timeout 15 \
       -K <(printf 'header = "AccessKey: %s"\n' "${!keyvar}") "$@"
}

# Liste un dossier d'une zone, sans descendre dans les sous-dossiers. Une ligne par entrée :
#   <true|false si dossier> TAB <nom> TAB <taille> TAB <empreinte SHA-256 en minuscules, ou -> TAB <date de création>
# Un dossier absent donne une liste vide.
zone_list() {  # zone_list <zone> <nom de la variable du mot de passe> <dossier>
  local body code
  body="$(mktemp)"
  code="$(zone_curl "$2" --output "$body" --write-out '%{http_code}' -H 'Accept: application/json' \
                    "$(zone_url "$1" "${3%/}")/")" || code="000"
  case "$code" in
    200) jq -r '.[] | [(.IsDirectory | tostring), .ObjectName, (.Length | tostring),
                       ((.Checksum // "") | ascii_downcase | if . == "" then "-" else . end),
                       (.DateCreated // "-")] | @tsv' "$body" ;;
    404) ;;
    *)   rm -f "$body"; fail "listing de « $1/$3 » impossible (HTTP $code)" ;;
  esac
  rm -f "$body"
}

# Liste récursive des fichiers sous <dossier> :
#   <chemin complet> TAB <taille> TAB <empreinte ou -> TAB <date de création>
zone_list_recursive() {  # zone_list_recursive <zone> <nom de la variable du mot de passe> <dossier>
  local dir="${3%/}" listing is_dir name size sum created
  listing="$(zone_list "$1" "$2" "$dir")"
  [ -n "$listing" ] || return 0
  while IFS=$'\t' read -r is_dir name size sum created; do
    if [ "$is_dir" = "true" ]; then
      zone_list_recursive "$1" "$2" "$dir/$name"
    else
      printf '%s\t%s\t%s\t%s\n' "$dir/$name" "$size" "$sum" "$created"
    fi
  done <<<"$listing"
}

# ── Bunny Storage : zone de sauvegarde ────────────────────────────────────────
bunny_url() {
  zone_url "$BUNNY_BACKUP_ZONE" "$1"
}

bunny_curl() {
  zone_curl BUNNY_BACKUP_ZONE_KEY "$@"
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
  zone_list "$BUNNY_BACKUP_ZONE" BUNNY_BACKUP_ZONE_KEY "$1" | cut -f1-3
}

# Liste récursive : affiche le chemin complet de chaque fichier sous <dossier distant>.
bunny_list_recursive() {  # bunny_list_recursive <dossier distant>
  zone_list_recursive "$BUNNY_BACKUP_ZONE" BUNNY_BACKUP_ZONE_KEY "$1" | cut -f1
}

# ── Bunny Storage : zones de l'application (étape 3) ──────────────────────────
# La zone d'une clé se déduit de la clé, comme dans le backend (StoragePaths.isPrivate).
key_zone_kind() {  # key_zone_kind <clé> : affiche « private » ou « public »
  case "$1" in
    uploads/utilisateur/*) printf 'private' ;;
    *)                     printf 'public' ;;
  esac
}

# Mot de passe de lecture d'une zone : le mot de passe en lecture seule s'il est défini, sinon celui
# d'écriture (présent dans amame-ops pendant la migration seulement). Affiche le NOM de la variable.
read_key_var() {  # read_key_var public|private
  local upper read_var
  upper="$(printf '%s' "$1" | tr 'a-z' 'A-Z')"
  read_var="BUNNY_${upper}_ZONE_READ_KEY"
  if [ -n "${!read_var:-}" ]; then
    printf '%s' "$read_var"
  else
    printf 'BUNNY_%s_ZONE_KEY' "$upper"
  fi
}

# ── Base : références vers file_entity ────────────────────────────────────────
# Écrit une requête SQL qui renvoie une ligne (id) par référence vers file_entity, d'après toutes les
# clés étrangères du catalogue : la liste suit le schéma sans avoir à être tenue à jour ici.
# Une ligne référencée par deux entités apparaît deux fois (UNION ALL).
file_references_sql() {  # file_references_sql <commande psql…>
  "$@" -c "
    SELECT COALESCE(
      string_agg(format('SELECT %I AS id FROM %s WHERE %I IS NOT NULL',
                        a.attname, c.conrelid::regclass, a.attname), ' UNION ALL '),
      'SELECT NULL::bigint AS id WHERE false')
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND c.confrelid = 'public.file_entity'::regclass"
}
