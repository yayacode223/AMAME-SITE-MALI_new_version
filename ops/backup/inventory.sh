#!/usr/bin/env bash
# Inventaire croisé des fichiers (docs/03, étape 2, action 2.1). LECTURE SEULE : la session SQL est
# ouverte en lecture seule et le dossier des uploads est monté en lecture seule.
#
# Compare les lignes file_entity au dossier réel des uploads, puis aux entités qui les référencent
# (toutes les clés étrangères vers file_entity, lues dans le catalogue). Chaque fichier tombe dans une
# catégorie ; trois sont bloquantes, et doivent être à zéro AVANT de déployer l'étape 2 :
#   - référence cassée : ligne référencée par une entité, fichier absent du disque ;
#   - clé en double    : plusieurs lignes avec la même clé (la migration V2 échouerait) ;
#   - ligne partagée   : une ligne référencée par plusieurs entités (remplacer le fichier de l'une
#                        supprimerait la ligne encore utilisée par l'autre).
# Les autres catégories sont des informations à traiter avant l'étape 3 : lignes orphelines
# (delete-orphan-rows.sh), fichiers orphelins, écarts de taille, clés hors format, métadonnées
# manquantes (backfill-sha256.sh).
#
#   inventory.sh                      rapport, et listes détaillées dans un dossier temporaire
#   INVENTORY_DIR=/tmp/x inventory.sh dossier des listes détaillées
#
# Code de sortie : 0 si aucune anomalie bloquante, 1 sinon.

. /usr/local/bin/lib.sh

require_env BACKUP_DATABASE_URL
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"
INVENTORY_DIR="${INVENTORY_DIR:-/tmp/inventaire-$(date -u +%Y%m%dT%H%M%SZ)}"
SHOW="${INVENTORY_SHOW:-20}"

[ -d "$UPLOADS_DIR" ] || fail "dossier des uploads introuvable : $UPLOADS_DIR"
mkdir -p "$INVENTORY_DIR"

# Lecture seule garantie par le serveur : toute écriture de cette session serait refusée.
ro_psql() { PGOPTIONS='-c default_transaction_read_only=on' psql "$BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }

# ── 1. Lignes file_entity, avec leur nombre de références ─────────────────────
references="$(file_references_sql ro_psql)"
has_sha="$(ro_psql -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'file_entity' AND column_name = 'file_sha256')")"
if [ "$has_sha" = "t" ]; then sha_expr="f.file_sha256 IS NOT NULL"; else sha_expr="false"; fi

# Colonnes : id, clé, nom, MIME présent, taille, empreinte présente, références, clé au format, nom cohérent
ro_psql -F $'\t' -c "
  WITH refs AS ($references),
       counts AS (SELECT id, count(*) AS n FROM refs GROUP BY id)
  SELECT f.id, f.file_path, f.file_name,
         (f.file_mime_type IS NOT NULL AND f.file_mime_type <> '')::text,
         COALESCE(f.file_size::text, ''),
         ($sha_expr)::text,
         COALESCE(c.n, 0),
         (f.file_path ~ '^uploads/[a-z0-9_-]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}\$')::text,
         (right(f.file_path, length(f.file_name) + 1) = '/' || f.file_name)::text
    FROM public.file_entity f
    LEFT JOIN counts c ON c.id = f.id
   ORDER BY f.id" > "$INVENTORY_DIR/rows.tsv"

# ── 2. Fichiers du disque, sous forme de clés ─────────────────────────────────
find "$UPLOADS_DIR" -type f -printf 'uploads/%P\t%s\n' | sort > "$INVENTORY_DIR/disk.tsv"

# Clés en attente de purge (migration V3) : un fichier dont la ligne vient d'être supprimée n'est
# pas un orphelin, il attend la fin de la rétention.
has_queue="$(ro_psql -c "SELECT to_regclass('public.storage_purge_queue') IS NOT NULL")"
if [ "$has_queue" = "t" ]; then
  ro_psql -c "SELECT DISTINCT object_key FROM public.storage_purge_queue WHERE purged_at IS NULL" > "$INVENTORY_DIR/queue.tsv"
else
  : > "$INVENTORY_DIR/queue.tsv"
fi

# ── 3. Classement ─────────────────────────────────────────────────────────────
awk -F'\t' -v OFS='\t' -v out="$INVENTORY_DIR" '
  FILENAME == ARGV[1] { disk[$1] = $2; disk_count++; next }
  FILENAME == ARGV[2] { queued[$1] = 1; next }
  {
    id = $1; key = $2; refs = $7 + 0
    rows++
    seen[key]++
    on_disk = (key in disk)
    if (on_disk) used[key] = 1
    if (refs > 1)                       { print id, key, refs > (out "/lignes-partagees.tsv"); shared++ }
    if (refs > 0 && !on_disk)           { print id, key > (out "/references-cassees.tsv"); broken++ }
    else if (refs > 0)                  { coherent++ }
    if (refs == 0)                      { print id, key, (on_disk ? "fichier present" : "fichier absent") > (out "/lignes-orphelines.tsv"); orphan_rows++ }
    if (on_disk && $5 != "" && $5 != disk[key]) { print id, key, "base " $5, "disque " disk[key] > (out "/ecarts-de-taille.tsv"); size_diff++ }
    if ($8 != "true")                   { print id, key > (out "/cles-hors-format.tsv"); bad_format++ }
    if ($9 != "true")                   { print id, key, $3 > (out "/noms-incoherents.tsv"); bad_name++ }
    if ($4 != "true" || $5 == "")       { print id, key > (out "/metadonnees-manquantes.tsv"); missing_meta++ }
    if ($6 != "true")                   { no_sha++ }
  }
  END {
    for (k in seen) if (seen[k] > 1) { print k, seen[k] > (out "/cles-en-double.tsv"); dup++ }
    for (k in disk) if (!(k in used)) {
      if (k in queued) { pending++; continue }
      print k, disk[k] > (out "/fichiers-orphelins.tsv"); orphan_files++
    }
    printf "rows=%d coherent=%d broken=%d dup=%d shared=%d orphan_rows=%d orphan_files=%d pending=%d size_diff=%d bad_format=%d bad_name=%d missing_meta=%d no_sha=%d disk=%d\n",
      rows, coherent, broken, dup, shared, orphan_rows, orphan_files, pending, size_diff, bad_format, bad_name, missing_meta, no_sha, disk_count
  }
' "$INVENTORY_DIR/disk.tsv" "$INVENTORY_DIR/queue.tsv" "$INVENTORY_DIR/rows.tsv" > "$INVENTORY_DIR/resume.txt"

declare -A n
for pair in $(cat "$INVENTORY_DIR/resume.txt"); do n["${pair%%=*}"]="${pair#*=}"; done

show() {  # show <titre> <fichier>
  local file="$INVENTORY_DIR/$2"
  [ -s "$file" ] || return 0
  log "$1 (au plus $SHOW, liste complète : $file) :"
  sort "$file" -o "$file"
  head -n "$SHOW" "$file" | sed 's/^/    /'
}

log "inventaire croisé : base « file_entity » contre $UPLOADS_DIR"
log "  lignes file_entity           : ${n[rows]}"
log "  fichiers sur le disque       : ${n[disk]}"
log "  cohérents                    : ${n[coherent]}"
log "  références cassées           : ${n[broken]}    (bloquant)"
log "  clés en double               : ${n[dup]}    (bloquant)"
log "  lignes partagées             : ${n[shared]}    (bloquant)"
log "  lignes orphelines            : ${n[orphan_rows]}    (à supprimer : delete-orphan-rows.sh)"
log "  fichiers orphelins           : ${n[orphan_files]}    (non migrés vers Bunny ; conservés dans la sauvegarde)"
log "  fichiers en attente de purge : ${n[pending]}    (ligne supprimée, effacement après la rétention)"
log "  écarts de taille             : ${n[size_diff]}"
log "  clés hors format             : ${n[bad_format]}"
log "  noms incohérents avec la clé : ${n[bad_name]}"
log "  MIME ou taille manquants     : ${n[missing_meta]}"
if [ "$has_sha" = "t" ]; then
  log "  sans empreinte SHA-256       : ${n[no_sha]}    (à remplir : backfill-sha256.sh)"
else
  log "  empreintes SHA-256           : colonne absente, migration V2 pas encore appliquée"
fi

show "RÉFÉRENCES CASSÉES : restaurer le fichier depuis la sauvegarde (restore-files.sh), sinon retirer le fichier de l'entité" references-cassees.tsv
show "CLÉS EN DOUBLE" cles-en-double.tsv
show "LIGNES PARTAGÉES (id, clé, nombre de références)" lignes-partagees.tsv
show "Lignes orphelines" lignes-orphelines.tsv
show "Fichiers orphelins" fichiers-orphelins.tsv
show "Écarts de taille" ecarts-de-taille.tsv
show "Clés hors format" cles-hors-format.tsv
show "Noms incohérents avec la clé (id, clé, nom)" noms-incoherents.tsv
show "MIME ou taille manquants" metadonnees-manquantes.tsv

if [ "${n[broken]}" -ne 0 ] || [ "${n[dup]}" -ne 0 ] || [ "${n[shared]}" -ne 0 ]; then
  fail "inventaire NON CONFORME : anomalies bloquantes ci-dessus, à traiter avant de déployer l'étape 2"
fi
log "inventaire conforme : aucune référence cassée, aucune clé en double, aucune ligne partagée"
