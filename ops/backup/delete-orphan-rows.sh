#!/usr/bin/env bash
# Supprime les lignes file_entity orphelines (docs/03, étape 2, action 2.4) : celles qu'aucune
# entité ne référence, laissées par les anciens remplacements de fichiers.
#
# La suppression passe par la file de purge : le déclencheur de la migration V3 inscrit chaque clé
# supprimée dans storage_purge_queue, et l'objet n'est effacé qu'après la rétention (10 jours).
# Pendant ce délai, une erreur s'annule en restaurant la ligne et en retirant l'entrée de la file.
# Le script refuse donc de supprimer quoi que ce soit tant que ce déclencheur n'existe pas.
#
# Par prudence, une ligne n'est retenue que si elle date de plus de 2 jours (ou n'a pas de date).
#
#   delete-orphan-rows.sh           simulation : liste les lignes, ne supprime rien
#   delete-orphan-rows.sh --apply   supprime, en une transaction
#
# Connexion : BACKUP_DATABASE_URL, avec un compte qui peut écrire dans file_entity (postgres tant
# que la base est sur le VPS). À lancer après validation de la liste par l'équipe.

. /usr/local/bin/lib.sh

require_env BACKUP_DATABASE_URL
APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true
db() { psql "$BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }

has_trigger="$(db -c "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
                      WHERE tgname = 'file_entity_enqueue_purge' AND tgrelid = 'public.file_entity'::regclass)")"
[ "$has_trigger" = "t" ] || fail "déclencheur file_entity_enqueue_purge absent : déployer d'abord backend-v1.3 (migration V3)"

references="$(file_references_sql db)"
orphans_sql="SELECT f.id FROM public.file_entity f
              WHERE f.id NOT IN (SELECT id FROM ($references) r WHERE id IS NOT NULL)
                AND (f.upload_date IS NULL OR f.upload_date < now() - interval '2 days')"

listing="$(db -F $'\t' -c "SELECT f.id, f.file_path, COALESCE(to_char(f.upload_date, 'YYYY-MM-DD'), 'sans date')
                           FROM public.file_entity f WHERE f.id IN ($orphans_sql) ORDER BY f.id")"
count=0
[ -z "$listing" ] || count="$(printf '%s\n' "$listing" | wc -l)"
log "lignes orphelines de plus de 2 jours : $count"
[ "$count" -eq 0 ] && exit 0
printf '%s\n' "$listing" | sed 's/^/    /'

if [ "$APPLY" != "true" ]; then
  log "SIMULATION : rien n'a été supprimé. Relancer avec --apply après validation de la liste."
  exit 0
fi

deleted="$(db -c "WITH d AS (DELETE FROM public.file_entity WHERE id IN ($orphans_sql) RETURNING 1)
                  SELECT count(*) FROM d")"
log "lignes supprimées : $deleted ; leurs fichiers sont inscrits dans storage_purge_queue et seront effacés après la rétention"
