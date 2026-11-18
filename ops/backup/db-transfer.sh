#!/usr/bin/env bash
# Transfert de la base vers une base cible VIDE : répétition sur une branche Neon (étape 4.2), puis
# bascule (4.3). docs/03, §5, étape 4 ; docs/neon/02, §7.
#
#   db-transfer.sh             simulation : contrôle les deux connexions, la cible vide et les rôles
#   db-transfer.sh --apply     dump de la source, restauration dans la cible, droits, comparaison
#
# Variables :
#   SOURCE_DATABASE_URL  base d'origine (par défaut BACKUP_DATABASE_URL), lue en lecture seule
#   TARGET_DATABASE_URL  base cible, avec son rôle PROPRIÉTAIRE (amame_owner), sur le point d'accès
#                        direct de Neon (sans « -pooler »), avec sslmode=verify-full&sslrootcert=system
#
# La restauration se fait en une seule transaction : en cas d'erreur, la cible reste vide. Le script
# refuse une cible qui contient déjà des tables : il ne remplace jamais rien. Pour la bascule, arrêter
# d'abord le backend : le dump fige alors la base et Bunny dans le même état (§5, 4.3).
# Rien n'est écrit dans la source. Aucun mot de passe n'est affiché.

. /usr/local/bin/lib.sh

APPLY=false
case "${1:-}" in
  "") ;;
  --apply) APPLY=true ;;
  *) fail "argument inconnu : $1 (attendu : rien, ou --apply)" ;;
esac

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-${BACKUP_DATABASE_URL:-}}"
require_env SOURCE_DATABASE_URL TARGET_DATABASE_URL
[ "$SOURCE_DATABASE_URL" != "$TARGET_DATABASE_URL" ] || fail "source et cible désignent la même base"
GRANTS_SQL="${GRANTS_SQL:-/usr/local/share/amame/db-grants.sql}"
[ -r "$GRANTS_SQL" ] || fail "script des droits introuvable : $GRANTS_SQL"

src() { PGOPTIONS='-c default_transaction_read_only=on' psql "$SOURCE_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }
tgt() { psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }
# Hôte et base d'une URL, sans l'utilisateur ni le mot de passe
where() { psql "$1" -AtX -c "SELECT coalesce(inet_server_addr()::text, 'socket') || ' / ' || current_database() || ' / ' || current_user" 2>/dev/null; }

# ── Contrôles ─────────────────────────────────────────────────────────────────
src -c 'SELECT 1' >/dev/null || fail "source injoignable"
tgt -c 'SELECT 1' >/dev/null || fail "cible injoignable (point d'accès direct, sans « -pooler » ? sslmode ?)"
log "source : PostgreSQL $(src -c 'SHOW server_version' | cut -d' ' -f1), $(where "$SOURCE_DATABASE_URL")"
log "cible  : PostgreSQL $(tgt -c 'SHOW server_version' | cut -d' ' -f1), $(where "$TARGET_DATABASE_URL")"
log "outils : $(pg_dump --version), $(pg_restore --version | awk '{print $NF}') pour pg_restore"

source_tables="$(src -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")"
[ "$source_tables" -gt 0 ] || fail "la source n'a aucune table : mauvaise base ?"
others="$(src -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND backend_type = 'client backend'")"
log "source : $source_tables tables ; autres connexions ouvertes : $others (0 attendu pour la bascule, backend arrêté)"

target_tables="$(tgt -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")"
[ "$target_tables" -eq 0 ] || fail "la cible contient déjà $target_tables table(s) : ce script ne remplace jamais une base"
[ "$(tgt -c "SELECT has_schema_privilege('public', 'CREATE')")" = "t" ] \
  || fail "le rôle de la cible ne peut pas créer dans le schéma public : utiliser le rôle propriétaire (amame_owner)"
missing="$(tgt -c "SELECT string_agg(r, ', ') FROM unnest(ARRAY['amame_app', 'amame_scraper', 'amame_backup']) r
                   WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r)")"
[ -z "$missing" ] || fail "rôle(s) absent(s) de la cible : $missing (à créer d'abord : ops/README.md)"
log "cible : vide, rôles amame_app, amame_scraper et amame_backup présents"

if [ "$APPLY" != true ]; then
  log "SIMULATION : rien n'a été transféré. Relancer avec --apply."
  exit 0
fi

# ── Transfert ─────────────────────────────────────────────────────────────────
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
start=$(date +%s)
PGOPTIONS='-c default_transaction_read_only=on' pg_dump --format=custom --file="$work/db.dump" "$SOURCE_DATABASE_URL" \
  || fail "dump de la source impossible"
dumped=$(date +%s)
log "dump : $(stat -c %s "$work/db.dump") octets en $((dumped - start)) s"

pg_restore --no-owner --no-privileges --exit-on-error --single-transaction \
           --dbname="$TARGET_DATABASE_URL" "$work/db.dump" 2> "$work/restore.err" \
  || { cat "$work/restore.err" >&2; fail "restauration refusée : la cible est restée vide"; }
restored=$(date +%s)
log "restauration : $((restored - dumped)) s"

tgt -q -f "$GRANTS_SQL" > /dev/null || fail "droits des rôles non appliqués (db-grants.sql) : la cible est restaurée mais inutilisable par le backend"
log "droits des rôles appliqués"

/usr/local/bin/db-compare.sh || fail "les deux bases diffèrent après le transfert : ne pas basculer"
log "transfert terminé en $(( $(date +%s) - start )) s"
