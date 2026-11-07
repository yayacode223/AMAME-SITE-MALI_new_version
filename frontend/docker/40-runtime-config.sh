#!/bin/sh
# Écrit config.js à partir des variables de la stack, à chaque démarrage du conteneur.
# Lancé par l'entrypoint de l'image nginx (dossier /docker-entrypoint.d/), avant Nginx.
#
# Une valeur invalide arrête le démarrage avec un message explicite : mieux vaut un conteneur
# qui refuse de partir qu'un site qui pointe ses images vers une adresse fausse.
set -eu

TARGET="${RUNTIME_CONFIG_FILE:-/usr/share/nginx/html/config.js}"

MEDIA_BASE_URL="${MEDIA_BASE_URL:-}"
# Sans « / » final, comme côté backend
while [ "${MEDIA_BASE_URL%/}" != "$MEDIA_BASE_URL" ]; do
  MEDIA_BASE_URL="${MEDIA_BASE_URL%/}"
done

# La valeur est recopiée dans du JavaScript : seuls les caractères d'une URL simple sont admis.
if [ -n "$MEDIA_BASE_URL" ] && ! printf '%s' "$MEDIA_BASE_URL" | grep -Eq '^https?://[A-Za-z0-9._~:/-]+$'; then
  echo "MEDIA_BASE_URL invalide : « $MEDIA_BASE_URL ». Attendu : vide, ou une URL du type https://media.amame.ml" >&2
  exit 1
fi

case "${MEDIA_OPTIMIZER_ENABLED:-false}" in
  true) OPTIMIZER=true ;;
  false | "") OPTIMIZER=false ;;
  *)
    echo "MEDIA_OPTIMIZER_ENABLED invalide : « ${MEDIA_OPTIMIZER_ENABLED} ». Attendu : true ou false" >&2
    exit 1
    ;;
esac

cat > "$TARGET" <<EOF
// Généré au démarrage du conteneur par 40-runtime-config.sh : ne pas modifier à la main.
window.__AMAME_CONFIG__ = { mediaBaseUrl: "$MEDIA_BASE_URL", mediaOptimizerEnabled: $OPTIMIZER };
EOF

echo "40-runtime-config.sh : mediaBaseUrl=\"$MEDIA_BASE_URL\", mediaOptimizerEnabled=$OPTIMIZER"
