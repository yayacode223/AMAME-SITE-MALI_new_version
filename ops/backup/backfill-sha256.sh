#!/usr/bin/env bash
# Remplit l'empreinte SHA-256 des fichiers déjà en base (docs/03, étape 2, action 2.2), en lisant
# chaque fichier référencé dans le dossier des uploads (monté en lecture seule).
#
# Une ligne n'est complétée que si son fichier est présent et que la taille connue de la base
# correspond à celle du disque : une empreinte doit décrire le contenu que la base décrit, pas un
# fichier qui aurait divergé. La taille et le type MIME sont complétés au passage s'ils manquent.
# Seules des colonnes vides sont écrites ; la clé n'est jamais touchée. Idempotent.
#
# Prérequis : migration V2 appliquée (backend-v1.3 démarré au moins une fois).
#
#   backfill-sha256.sh           simulation : affiche ce qui serait écrit, n'écrit rien
#   backfill-sha256.sh --apply   écrit les empreintes
#
# Connexion : BACKUP_DATABASE_URL, avec un compte qui peut écrire dans file_entity (postgres tant
# que la base est sur le VPS). Une ligne refusée par une contrainte (clé hors format, par exemple)
# est signalée et laissée vide ; les autres sont écrites.

. /usr/local/bin/lib.sh

require_env BACKUP_DATABASE_URL
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"
APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true

[ -d "$UPLOADS_DIR" ] || fail "dossier des uploads introuvable : $UPLOADS_DIR"
db() { psql "$BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }

has_sha="$(db -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'file_entity' AND column_name = 'file_sha256')")"
[ "$has_sha" = "t" ] || fail "colonne file_entity.file_sha256 absente : déployer d'abord backend-v1.3 (migration V2)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

db -F $'\t' -c "SELECT id, file_path, COALESCE(file_size::text, ''), COALESCE(file_mime_type, '')
                  FROM public.file_entity WHERE file_sha256 IS NULL ORDER BY id" > "$work/todo.tsv"
todo="$(wc -l < "$work/todo.tsv")"
log "lignes sans empreinte : $todo"

ready=0; absent=0; size_diff=0
: > "$work/updates.sql"
while IFS=$'\t' read -r id key size mime; do
  [ -n "$id" ] || continue
  case "$key" in
    uploads/*) path="$UPLOADS_DIR/${key#uploads/}" ;;
    *)         log "IGNORÉE : ligne $id, clé hors de uploads/ : $key"; absent=$((absent + 1)); continue ;;
  esac
  if [ ! -f "$path" ]; then
    log "ABSENT : ligne $id, $key (référence cassée ou ligne orpheline : voir inventory.sh)"
    absent=$((absent + 1))
    continue
  fi
  actual_size="$(stat -c %s "$path")"
  if [ -n "$size" ] && [ "$size" != "$actual_size" ]; then
    log "TAILLE DIFFÉRENTE : ligne $id, $key (base : $size, disque : $actual_size) : empreinte non écrite"
    size_diff=$((size_diff + 1))
    continue
  fi
  sum="$(sha256sum "$path" | cut -d' ' -f1)"
  set_extra=""
  [ -n "$size" ] || set_extra="$set_extra, file_size = $actual_size"
  if [ -z "$mime" ]; then
    detected="$(file --brief --mime-type "$path")"
    set_extra="$set_extra, file_mime_type = '${detected//\'/\'\'}'"
  fi
  printf "UPDATE public.file_entity SET file_sha256 = '%s'%s WHERE id = %s AND file_sha256 IS NULL;\n" \
         "$sum" "$set_extra" "$id" >> "$work/updates.sql"
  ready=$((ready + 1))
done < "$work/todo.tsv"

log "empreintes prêtes : $ready ; fichiers absents ou ignorés : $absent ; écarts de taille : $size_diff"

if [ "$APPLY" != "true" ]; then
  log "SIMULATION : rien n'a été écrit. Relancer avec --apply pour écrire les $ready empreinte(s)."
  exit 0
fi

# Chaque UPDATE est validé seul : une ligne refusée par une contrainte n'empêche pas les autres.
if [ "$ready" -gt 0 ]; then
  psql "$BACKUP_DATABASE_URL" -X -q -v ON_ERROR_STOP=0 -f "$work/updates.sql" 2> "$work/errors.log" || true
  if [ -s "$work/errors.log" ]; then
    log "lignes refusées par la base :"
    sed 's/^/    /' "$work/errors.log"
  fi
fi
remaining="$(db -c "SELECT count(*) FROM public.file_entity WHERE file_sha256 IS NULL")"
total="$(db -c "SELECT count(*) FROM public.file_entity")"
log "terminé : $((total - remaining)) ligne(s) sur $total ont une empreinte ; $remaining sans empreinte"
[ "$remaining" -eq 0 ] || log "objectif de l'étape 2 : 100 % des lignes. Traiter les lignes restantes (inventory.sh) puis relancer."
