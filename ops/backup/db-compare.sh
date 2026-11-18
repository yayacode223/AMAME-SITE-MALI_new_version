#!/usr/bin/env bash
# Compare deux bases, en lecture seule des deux côtés (étape 4 : docs/03, §5, action 4.3 ; docs/neon/02, §7.3).
# Sert après un transfert (db-transfer.sh le lance de lui-même) et avant de basculer le backend.
#
#   db-compare.sh
#
# Variables : SOURCE_DATABASE_URL (par défaut BACKUP_DATABASE_URL) et TARGET_DATABASE_URL.
#
# Compare : tables et nombre de lignes de chacune ; liste triée des clés de fichiers, avec empreinte,
# taille, type et MIME ; historique Flyway ; colonnes ; contraintes (et leur validation) ; déclencheurs ;
# fonctions (texte) ; index ; valeur courante des séquences. Les droits et les propriétaires ne sont pas
# comparés : ils diffèrent par construction (rôles de la cible, db-grants.sql).
# Code de sortie : 0 si les deux bases sont identiques sur tous ces points, 1 sinon.

. /usr/local/bin/lib.sh

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-${BACKUP_DATABASE_URL:-}}"
require_env SOURCE_DATABASE_URL TARGET_DATABASE_URL
[ "$SOURCE_DATABASE_URL" != "$TARGET_DATABASE_URL" ] || fail "source et cible désignent la même base"

COMPARE_DIR="${COMPARE_DIR:-/tmp/comparaison-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$COMPARE_DIR"

ro() {  # ro <url> <requête>
  PGOPTIONS='-c default_transaction_read_only=on' psql "$1" -v ON_ERROR_STOP=1 -AtX -F $'\t' -c "$2"
}

declare -A QUERY
QUERY[lignes]="
  SELECT table_name,
         (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name),
                                              false, true, '')))[1]::text::bigint
    FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
   ORDER BY table_name"
QUERY[fichiers]="
  SELECT file_path, COALESCE(file_sha256, '-'), COALESCE(file_size::text, '-'), file_type, COALESCE(file_mime_type, '-')
    FROM public.file_entity ORDER BY file_path"
QUERY[flyway]="
  SELECT installed_rank, COALESCE(version, '-'), script, COALESCE(checksum::text, '-'), success
    FROM public.flyway_schema_history ORDER BY installed_rank"
QUERY[colonnes]="
  SELECT table_name, column_name, data_type, COALESCE(character_maximum_length::text, '-'), is_nullable,
         COALESCE(column_default, '-'), is_identity
    FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name"
# Sans les NOT NULL (contype 'n') : PostgreSQL 18 les inscrit dans pg_constraint, 15 et 17 non. Ils
# sont déjà comparés par « colonnes » (is_nullable).
QUERY[contraintes]="
  SELECT conrelid::regclass::text, conname, contype, convalidated
    FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND contype <> 'n' ORDER BY 1, 2"
QUERY[declencheurs]="
  SELECT tgrelid::regclass::text, tgname, tgenabled
    FROM pg_trigger WHERE NOT tgisinternal AND tgrelid::regclass::text NOT LIKE 'pg\_%' ORDER BY 1, 2"
QUERY[fonctions]="
  SELECT proname, md5(prosrc) FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY 1, 2"
QUERY[index]="
  SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1, 2"
QUERY[sequences]="
  SELECT sequencename, COALESCE(last_value::text, 'jamais utilisée') FROM pg_sequences WHERE schemaname = 'public' ORDER BY 1"

log "comparaison : source $(ro "$SOURCE_DATABASE_URL" 'SHOW server_version' | cut -d' ' -f1), cible $(ro "$TARGET_DATABASE_URL" 'SHOW server_version' | cut -d' ' -f1)"
differences=0
for name in lignes fichiers flyway colonnes contraintes declencheurs fonctions index sequences; do
  ro "$SOURCE_DATABASE_URL" "${QUERY[$name]}" > "$COMPARE_DIR/$name.source.tsv"
  ro "$TARGET_DATABASE_URL" "${QUERY[$name]}" > "$COMPARE_DIR/$name.cible.tsv"
  n="$(wc -l < "$COMPARE_DIR/$name.source.tsv")"
  if diff -u "$COMPARE_DIR/$name.source.tsv" "$COMPARE_DIR/$name.cible.tsv" > "$COMPARE_DIR/$name.diff"; then
    log "  identiques   $name ($n)"
  else
    log "  DIFFÉRENTS   $name : source $n, cible $(wc -l < "$COMPARE_DIR/$name.cible.tsv") (détail : $COMPARE_DIR/$name.diff)"
    head -n 20 "$COMPARE_DIR/$name.diff" | sed 's/^/      /'
    differences=$((differences + 1))
  fi
done

rows="$(awk -F'\t' '{ s += $2 } END { print s + 0 }' "$COMPARE_DIR/lignes.source.tsv")"
[ "$differences" -eq 0 ] \
  || fail "bases DIFFÉRENTES sur $differences point(s) : ne pas basculer (fichiers dans $COMPARE_DIR)"
log "bases identiques : $(wc -l < "$COMPARE_DIR/lignes.source.tsv") tables, $rows lignes, $(wc -l < "$COMPARE_DIR/fichiers.source.tsv") clés de fichiers"
