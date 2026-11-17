#!/usr/bin/env bash
# Rapatrie sur le disque les fichiers décrits par la base qui n'y sont pas : retour arrière de la
# bascule vers Bunny (docs/03, étape 3, retour arrière, point 3).
#
# Pour chaque ligne file_entity dont le fichier manque dans <destination> : lecture dans sa zone
# Bunny, contrôle de la taille et de l'empreinte enregistrées en base, puis écriture. Un objet qui ne
# correspond pas à sa ligne n'est pas écrit : il est signalé. Ne remplace jamais un fichier présent ;
# ne modifie ni la base ni Bunny.
#
#   copy-from-bunny.sh <destination>           simulation : affiche ce qui serait rapatrié
#   copy-from-bunny.sh <destination> --apply   écrit
#
# <destination> : le dossier des uploads, tel que le backend le monte sur /app/uploads. Le service
# « backup » de amame-ops le monte en lecture seule : lancer ce script dans un conteneur ponctuel de
# l'image ops, en root, avec ce dossier monté en écriture (procédure : docs/03, étape 3, retour arrière).
#
# Variables : BACKUP_DATABASE_URL (lecture seule suffit) ; BUNNY_PUBLIC_ZONE, BUNNY_PRIVATE_ZONE et,
# pour chaque zone, son mot de passe en lecture seule (BUNNY_*_ZONE_READ_KEY) ou d'écriture (BUNNY_*_ZONE_KEY).
#
# Code de sortie : 0 si chaque ligne a son fichier sur le disque (ou est prête à être rapatriée), 1 sinon.

. /usr/local/bin/lib.sh

DEST="${1:-}"
APPLY=false
case "${2:-}" in
  --apply) APPLY=true ;;
  "") ;;
  *) fail "usage : copy-from-bunny.sh <destination> [--apply]" ;;
esac
[ -n "$DEST" ] || fail "usage : copy-from-bunny.sh <destination> [--apply]"
[ -d "$DEST" ] || fail "destination introuvable : $DEST"
if [ "$APPLY" = true ] && [ ! -w "$DEST" ]; then
  fail "destination en lecture seule : $DEST (monter le dossier des uploads en écriture, dans un conteneur ponctuel)"
fi

require_env BACKUP_DATABASE_URL BUNNY_PUBLIC_ZONE BUNNY_PRIVATE_ZONE
public_key="$(read_key_var public)"
private_key="$(read_key_var private)"
require_env "$public_key" "$private_key"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

ro_psql() { PGOPTIONS='-c default_transaction_read_only=on' psql "$BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }

# Colonnes : id, clé, taille, empreinte ; les plus récentes d'abord (créées depuis la bascule)
ro_psql -F $'\t' -c "
  SELECT id, file_path, COALESCE(file_size::text, ''), COALESCE(file_sha256, '')
    FROM public.file_entity
   ORDER BY upload_date DESC NULLS LAST, id DESC" > "$work/rows.tsv"

log "rapatriement : base « file_entity » vers $DEST, depuis $BUNNY_PUBLIC_ZONE et $BUNNY_PRIVATE_ZONE"
present=0 copied=0 to_copy=0 errors=0
while IFS=$'\t' read -r id key size sha; do
  target="$DEST/${key#uploads/}"
  if [ -e "$target" ]; then
    present=$((present + 1))
    continue
  fi
  if [ "$(key_zone_kind "$key")" = private ]; then
    zone="$BUNNY_PRIVATE_ZONE" keyvar="$private_key"
  else
    zone="$BUNNY_PUBLIC_ZONE" keyvar="$public_key"
  fi
  if [ "$APPLY" != true ]; then
    log "à rapatrier : $zone/$key, $size octets"
    to_copy=$((to_copy + 1))
    continue
  fi
  if ! zone_curl "$keyvar" --fail --output "$work/object" "$(zone_url "$zone" "$key")"; then
    log "ABSENT DE BUNNY : ligne $id, $zone/$key"
    errors=$((errors + 1))
    continue
  fi
  if [ "$(stat -c %s "$work/object")" != "$size" ] || [ "$(sha256sum "$work/object" | cut -d' ' -f1)" != "$sha" ]; then
    log "DIVERGENT : ligne $id, $zone/$key ne correspond pas à sa ligne (taille ou empreinte) : non écrit"
    errors=$((errors + 1))
    continue
  fi
  mkdir -p "$(dirname "$target")"
  # Copie dans le même dossier puis renommage : jamais de fichier à moitié écrit sous la clé.
  cp "$work/object" "$target.rapatriement"
  chmod 644 "$target.rapatriement"
  mv -n "$target.rapatriement" "$target"
  copied=$((copied + 1))
done < "$work/rows.tsv"
rm -f "$work/object"

log "lignes file_entity : $(wc -l < "$work/rows.tsv") ; déjà sur le disque : $present ; rapatriés : $copied ; erreurs : $errors"
if [ "$APPLY" != true ]; then
  log "SIMULATION : rien n'a été écrit. $to_copy fichier(s) à rapatrier. Relancer avec --apply."
fi
[ "$errors" -eq 0 ] || fail "rapatriement incomplet : $errors ligne(s) en erreur, voir ci-dessus"
