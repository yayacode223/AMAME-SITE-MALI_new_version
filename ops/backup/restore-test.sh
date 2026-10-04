#!/usr/bin/env bash
# Test de restauration du couple (dump + fichiers), lu dans la zone de sauvegarde.
# L'environnement est jetable : une instance PostgreSQL temporaire est démarrée dans ce
# conteneur, puis détruite avec tout ce qui a été téléchargé. La production n'est pas touchée.
#
# Le test réussit si le dump se restaure sans erreur ET si chaque ligne file_entity
# référencée par une entité retrouve son fichier dans la sauvegarde.
#
#   restore-test.sh                                    dernier dump disponible
#   restore-test.sh amame-20261003T023000Z.dump.gpg    un dump précis
#   RESTORE_VERIFY=presence restore-test.sh            sans télécharger les fichiers

. /usr/local/bin/lib.sh

require_env BACKUP_PASSPHRASE BUNNY_BACKUP_ZONE BUNNY_BACKUP_ZONE_KEY
RESTORE_VERIFY="${RESTORE_VERIFY:-full}"

work="$(mktemp -d)"
pgdata="$work/pg"
cleanup() {
  pg_ctl -D "$pgdata" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

# ── 1. Dump à tester ──────────────────────────────────────────────────────────
dump_name="${1:-}"
if [ -z "$dump_name" ]; then
  listing="$(bunny_list db)"
  dump_name="$(awk -F'\t' '$1 == "false" && $2 ~ /^amame-[0-9TZ]+\.dump\.gpg$/ { print $2 }' <<<"$listing" | sort | tail -n 1)"
  [ -n "$dump_name" ] || fail "aucun dump dans db/"
fi
log "dump testé : db/$dump_name"
bunny_get "db/$dump_name" "$work/db.dump.gpg"
decrypt_file "$work/db.dump.gpg" "$work/db.dump"

# ── 2. Instance PostgreSQL jetable (socket Unix uniquement, aucun port ouvert) ─
initdb -D "$pgdata" --auth=trust --username=postgres --encoding=UTF8 --locale=C > "$work/initdb.log" 2>&1   || { cat "$work/initdb.log"; fail "création de l'instance PostgreSQL temporaire impossible"; }
pg_ctl -D "$pgdata" -w -l "$work/pg.log" \
       -o "-c listen_addresses='' -c unix_socket_directories='$work' -c shared_buffers=32MB -c max_connections=10 -c fsync=off" \
       start >/dev/null
export PGHOST="$work" PGUSER=postgres
createdb --template=template0 amame_restore
export PGDATABASE=amame_restore

restore_status=0
pg_restore --no-owner --no-acl --dbname=amame_restore "$work/db.dump" 2> "$work/restore.err" || restore_status=$?
if [ "$restore_status" -ne 0 ]; then
  log "ERREUR : pg_restore a signalé des erreurs :"
  cat "$work/restore.err"
fi
tables="$(psql -AtX -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")"
log "base restaurée : $tables table(s)"

# ── 3. Lignes file_entity référencées par une entité ──────────────────────────
# Toutes les clés étrangères qui pointent vers file_entity sont lues dans le catalogue :
# la liste suit le schéma sans avoir à être tenue à jour ici.
referenced_ids="$(psql -AtX -c "
  SELECT COALESCE(
    string_agg(format('SELECT %I AS id FROM %s WHERE %I IS NOT NULL',
                      a.attname, c.conrelid::regclass, a.attname), ' UNION '),
    'SELECT NULL::bigint AS id WHERE false')
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
  WHERE c.contype = 'f' AND c.confrelid = 'file_entity'::regclass")"

psql -AtX -F $'\t' -c "
  SELECT f.file_path, COALESCE(f.file_size::text, '')
  FROM file_entity f
  WHERE f.id IN ($referenced_ids)
  ORDER BY 1" > "$work/referenced.tsv"
total_rows="$(psql -AtX -c 'SELECT count(*) FROM file_entity')"

# ── 4. Chaque ligne référencée retrouve-t-elle son fichier ? ──────────────────
bunny_list_recursive "files/uploads" | sed -e 's|^files/||' -e 's|\.gpg$||' | sort > "$work/backup-keys.txt"

checked=0
missing=0
mismatched=0
while IFS=$'\t' read -r key size; do
  [ -n "$key" ] || continue
  checked=$((checked + 1))
  if ! grep -qxF -- "$key" "$work/backup-keys.txt"; then
    log "MANQUANT : $key"
    missing=$((missing + 1))
    continue
  fi
  if [ "$RESTORE_VERIFY" = "full" ]; then
    bunny_get "files/$key.gpg" "$work/object.gpg"
    decrypt_file "$work/object.gpg" "$work/object"
    actual="$(stat -c %s "$work/object")"
    if [ -n "$size" ] && [ "$size" != "$actual" ]; then
      log "TAILLE DIFFÉRENTE : $key (base : $size octets, sauvegarde : $actual octets)"
      mismatched=$((mismatched + 1))
    fi
  fi
done < "$work/referenced.tsv"

cut -f1 "$work/referenced.tsv" | sort > "$work/referenced-keys.txt"
unreferenced_files="$(comm -13 "$work/referenced-keys.txt" "$work/backup-keys.txt" | wc -l)"

log "lignes file_entity : $total_rows au total, $checked référencée(s) par une entité"
log "fichiers de la sauvegarde : $(wc -l < "$work/backup-keys.txt"), dont $unreferenced_files sans ligne référencée (information)"
log "vérification « $RESTORE_VERIFY » : $missing fichier(s) manquant(s), $mismatched écart(s) de taille"

if [ "$restore_status" -ne 0 ] || [ "$missing" -ne 0 ] || [ "$mismatched" -ne 0 ]; then
  fail "test de restauration ÉCHOUÉ"
fi
log "test de restauration RÉUSSI : chaque ligne référencée retrouve son fichier"
