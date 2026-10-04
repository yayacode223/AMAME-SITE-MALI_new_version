#!/usr/bin/env bash
# Point d'entrée du conteneur d'exploitation.
#   sans argument : planificateur des sauvegardes (Portainer ne remplace pas un cron)
#   avec arguments : exécute la commande donnée, par exemple « backup.sh » ou « restore-test.sh »

. /usr/local/bin/lib.sh

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

BACKUP_DB_SCHEDULE="${BACKUP_DB_SCHEDULE:-02:30 14:30}"
for t in $BACKUP_DB_SCHEDULE; do
  [[ "$t" =~ ^([01][0-9]|2[0-3]):[0-5][0-9]$ ]] \
    || fail "BACKUP_DB_SCHEDULE : heure invalide « $t » (attendu : HH:MM en UTC, séparées par des espaces)"
done

# Nombre de secondes jusqu'à la prochaine heure planifiée.
seconds_until_next_run() {
  local now t target wait best=0
  now="$(date -u +%s)"
  for t in $BACKUP_DB_SCHEDULE; do
    target="$(date -u -d "today $t" +%s)"
    if [ "$target" -le "$now" ]; then
      target=$((target + 86400))
    fi
    wait=$((target - now))
    if [ "$best" -eq 0 ] || [ "$wait" -lt "$best" ]; then
      best="$wait"
    fi
  done
  printf '%s\n' "$best"
}

trap 'log "arrêt demandé"; exit 0' TERM INT

log "planificateur démarré — sauvegardes couplées à : $BACKUP_DB_SCHEDULE (UTC)"
while true; do
  wait_seconds="$(seconds_until_next_run)"
  log "prochaine sauvegarde dans $((wait_seconds / 60)) min"
  # « sleep » en arrière-plan : le conteneur réagit tout de suite à une demande d'arrêt
  sleep "$wait_seconds" &
  wait "$!"
  backup.sh || log "ERREUR : la sauvegarde a échoué (voir les lignes précédentes)"
done
