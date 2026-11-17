#!/usr/bin/env bash
# Réconciliation de la base avec Bunny, en mode rapport (docs/03, étape 3, action 3.4 ; DT8).
#
# Contrôle, ligne par ligne, que chaque fichier décrit par la base est présent dans la bonne zone,
# avec la taille et l'empreinte enregistrées (invariant I1), et relève les objets qu'aucune ligne ne
# référence (I2). Ne modifie rien, ni dans la base ni dans Bunny. La bascule (3.5) n'a lieu qu'à zéro
# anomalie bloquante.
#
# Périmètre strict : le préfixe uploads/ des zones publique et privée. Jamais static/, jamais la
# zone de sauvegarde.
#
# Variables : BACKUP_DATABASE_URL (lecture seule suffit) ; BUNNY_PUBLIC_ZONE et BUNNY_PRIVATE_ZONE ;
# pour chaque zone, son mot de passe en lecture seule (BUNNY_PUBLIC_ZONE_READ_KEY,
# BUNNY_PRIVATE_ZONE_READ_KEY) ou, à défaut, celui d'écriture (BUNNY_*_ZONE_KEY, pendant la migration).
#   RECONCILE_DIR   dossier des listes détaillées (défaut /tmp/reconciliation-<horodatage>)
#   RECONCILE_SHOW  nombre de lignes affichées par liste (défaut 20)
#
# Code de sortie : 0 si aucune anomalie bloquante, 1 sinon.

. /usr/local/bin/lib.sh

require_env BACKUP_DATABASE_URL BUNNY_PUBLIC_ZONE BUNNY_PRIVATE_ZONE
[ "$BUNNY_PUBLIC_ZONE" != "$BUNNY_PRIVATE_ZONE" ] || fail "BUNNY_PUBLIC_ZONE et BUNNY_PRIVATE_ZONE désignent la même zone"
public_key="$(read_key_var public)"
private_key="$(read_key_var private)"
require_env "$public_key" "$private_key"
RECONCILE_DIR="${RECONCILE_DIR:-/tmp/reconciliation-$(date -u +%Y%m%dT%H%M%SZ)}"
SHOW="${RECONCILE_SHOW:-20}"
mkdir -p "$RECONCILE_DIR"

ro_psql() { PGOPTIONS='-c default_transaction_read_only=on' psql "$BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }

# ── 1. Base : lignes et clés en attente de purge ──────────────────────────────
ro_psql -F $'\t' -c "SELECT id, file_path, COALESCE(file_size::text, ''), COALESCE(file_sha256, '')
                       FROM public.file_entity ORDER BY id" > "$RECONCILE_DIR/rows.tsv"
ro_psql -c "SELECT DISTINCT object_key FROM public.storage_purge_queue WHERE purged_at IS NULL" > "$RECONCILE_DIR/queue.tsv"

# ── 2. Bunny : objets des deux zones (clé, taille, empreinte, date de création) ─
zone_list_recursive "$BUNNY_PUBLIC_ZONE" "$public_key" uploads > "$RECONCILE_DIR/public.tsv"
zone_list_recursive "$BUNNY_PRIVATE_ZONE" "$private_key" uploads > "$RECONCILE_DIR/private.tsv"

# Un objet sans ligne de moins de 48 h peut être un upload en cours de validation (I2).
cutoff="$(date -u -d '-48 hours' +%Y-%m-%dT%H:%M:%S)"

# ── 3. Classement ─────────────────────────────────────────────────────────────
awk -F'\t' -v OFS='\t' -v out="$RECONCILE_DIR" -v cutoff="$cutoff" '
  function expected(key) { return (index(key, "uploads/utilisateur/") == 1) ? "private" : "public" }
  FILENAME == ARGV[1] { pub[$1] = $2 "\t" $3; pub_created[$1] = $4; public_count++; next }
  FILENAME == ARGV[2] { priv[$1] = $2 "\t" $3; priv_created[$1] = $4; private_count++; next }
  FILENAME == ARGV[3] { queued[$1] = 1; next }
  {
    id = $1; key = $2; size = $3; sha = $4
    rows++; known[key] = 1
    zone = expected(key)
    if (zone == "private") { found = (key in priv); other = (key in pub); remote = priv[key] }
    else                   { found = (key in pub);  other = (key in priv); remote = pub[key] }
    if (!found) {
      if (other) { print id, key, "attendu en zone " zone > (out "/mauvaise-zone.tsv"); wrong_zone++ }
      else       { print id, key > (out "/references-cassees.tsv"); broken++ }
      next
    }
    split(remote, r, "\t")
    if (r[1] != size)      { print id, key, "base " size, "Bunny " r[1] > (out "/ecarts-de-taille.tsv"); size_diff++; next }
    if (r[2] == "-")       { no_sum++; coherent++; next }
    if (r[2] != sha)       { print id, key > (out "/ecarts-empreinte.tsv"); sum_diff++; next }
    coherent++
  }
  END {
    for (k in pub) {
      if (expected(k) == "private") { print k > (out "/prives-dans-la-zone-publique.tsv"); exposed++ }
      if (k in known) continue
      classify(k, pub_created[k], "public")
    }
    for (k in priv) {
      if (k in known) continue
      classify(k, priv_created[k], "privée")
    }
    printf "rows=%d coherent=%d broken=%d wrong_zone=%d exposed=%d size_diff=%d sum_diff=%d no_sum=%d orphans_old=%d orphans_recent=%d pending=%d public=%d private=%d\n",
      rows, coherent, broken, wrong_zone, exposed, size_diff, sum_diff, no_sum, orphans_old, orphans_recent, pending, public_count, private_count
  }
  function classify(k, created, zone_label) {
    if (k in queued)            { pending++; return }
    if (created != "-" && created < cutoff) { print k, "zone " zone_label, created > (out "/orphelins.tsv"); orphans_old++ }
    else                        { orphans_recent++ }
  }
' "$RECONCILE_DIR/public.tsv" "$RECONCILE_DIR/private.tsv" "$RECONCILE_DIR/queue.tsv" "$RECONCILE_DIR/rows.tsv" \
  > "$RECONCILE_DIR/resume.txt"

declare -A n
for pair in $(cat "$RECONCILE_DIR/resume.txt"); do n["${pair%%=*}"]="${pair#*=}"; done

show() {  # show <titre> <fichier>
  local file="$RECONCILE_DIR/$2"
  [ -s "$file" ] || return 0
  log "$1 (au plus $SHOW, liste complète : $file) :"
  sort "$file" -o "$file"
  head -n "$SHOW" "$file" | sed 's/^/    /'
}

log "réconciliation : base « file_entity » contre Bunny ($BUNNY_PUBLIC_ZONE, $BUNNY_PRIVATE_ZONE), mode rapport"
log "  lignes file_entity              : ${n[rows]}"
log "  objets dans la zone publique    : ${n[public]}"
log "  objets dans la zone privée      : ${n[private]}"
log "  cohérents                       : ${n[coherent]}"
log "  références cassées              : ${n[broken]}    (bloquant)"
log "  objets dans la mauvaise zone    : ${n[wrong_zone]}    (bloquant)"
log "  fichiers privés en zone publique: ${n[exposed]}    (bloquant : servis par le CDN)"
log "  écarts de taille                : ${n[size_diff]}    (bloquant)"
log "  écarts d'empreinte              : ${n[sum_diff]}    (bloquant)"
log "  empreinte non fournie par Bunny : ${n[no_sum]}    (taille seule contrôlée)"
log "  objets orphelins (plus de 48 h) : ${n[orphans_old]}"
log "  objets récents sans ligne       : ${n[orphans_recent]}    (upload en cours possible)"
log "  objets en attente de purge      : ${n[pending]}"

show "RÉFÉRENCES CASSÉES : relancer copy-to-bunny.sh --apply" references-cassees.tsv
show "MAUVAISE ZONE (id, clé)" mauvaise-zone.tsv
show "FICHIERS PRIVÉS DANS LA ZONE PUBLIQUE : à supprimer de la zone publique depuis le panneau Bunny" prives-dans-la-zone-publique.tsv
show "ÉCARTS DE TAILLE" ecarts-de-taille.tsv
show "ÉCARTS D'EMPREINTE : relancer copy-to-bunny.sh --apply" ecarts-empreinte.tsv
show "Objets orphelins (clé, zone, date de création)" orphelins.tsv

if [ "${n[broken]}" -ne 0 ] || [ "${n[wrong_zone]}" -ne 0 ] || [ "${n[exposed]}" -ne 0 ] \
   || [ "${n[size_diff]}" -ne 0 ] || [ "${n[sum_diff]}" -ne 0 ]; then
  fail "réconciliation NON CONFORME : anomalies bloquantes ci-dessus, ne pas basculer"
fi
log "réconciliation conforme : chaque ligne a son objet dans la bonne zone, même taille, même empreinte"
