#!/usr/bin/env bash
# Copie vers Bunny des fichiers décrits par la base (docs/03, étape 3, action 3.3).
#
# Parcourt les lignes file_entity, et non le disque : Bunny ne reçoit que ce que la base référence
# (invariant I2), et chaque objet part avec l'empreinte SHA-256 enregistrée en base, que Bunny
# contrôle à la réception. Un fichier du disque qui ne correspond plus à sa ligne (taille ou
# empreinte) n'est pas envoyé : il est signalé.
#
# Idempotent : un objet déjà présent dans sa zone avec la même taille et la même empreinte est laissé
# tel quel, et réécrire une clé avec le même contenu ne change rien. Ne supprime jamais rien.
# Zone déduite de la clé, comme dans le backend : uploads/utilisateur/ dans la zone privée, le reste
# dans la zone publique.
#
#   copy-to-bunny.sh           simulation : affiche ce qui serait envoyé, n'envoie rien
#   copy-to-bunny.sh --apply   envoie
#
# Variables : BACKUP_DATABASE_URL (lecture seule suffit) ; BUNNY_PUBLIC_ZONE et BUNNY_PRIVATE_ZONE ;
# BUNNY_PUBLIC_ZONE_KEY et BUNNY_PRIVATE_ZONE_KEY, mots de passe d'écriture, présents dans amame-ops
# pendant la migration seulement (retirés à l'étape 6) ; UPLOADS_DIR (défaut /data/uploads).
#
# Code de sortie : 0 si chaque ligne a son objet dans Bunny (ou est prête à être envoyée), 1 sinon.

. /usr/local/bin/lib.sh

APPLY=false
case "${1:-}" in
  --apply) APPLY=true ;;
  "") ;;
  *) fail "usage : copy-to-bunny.sh [--apply]" ;;
esac

require_env BACKUP_DATABASE_URL BUNNY_PUBLIC_ZONE BUNNY_PUBLIC_ZONE_KEY BUNNY_PRIVATE_ZONE BUNNY_PRIVATE_ZONE_KEY
[ "$BUNNY_PUBLIC_ZONE" != "$BUNNY_PRIVATE_ZONE" ] \
  || fail "BUNNY_PUBLIC_ZONE et BUNNY_PRIVATE_ZONE désignent la même zone : les CV et photos seraient servis par le CDN"
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"
[ -d "$UPLOADS_DIR" ] || fail "dossier des uploads introuvable : $UPLOADS_DIR"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Lecture seule garantie par le serveur : toute écriture de cette session serait refusée.
ro_psql() { PGOPTIONS='-c default_transaction_read_only=on' psql "$BACKUP_DATABASE_URL" -v ON_ERROR_STOP=1 -AtX "$@"; }

# Colonnes : id, clé, taille, empreinte, type MIME
ro_psql -F $'\t' -c "
  SELECT id, file_path, COALESCE(file_size::text, ''), COALESCE(file_sha256, ''), COALESCE(file_mime_type, '')
    FROM public.file_entity
   ORDER BY id" > "$work/rows.tsv"
missing_sha="$(awk -F'\t' '$4 == ""' "$work/rows.tsv" | wc -l)"
[ "$missing_sha" -eq 0 ] \
  || fail "$missing_sha ligne(s) sans empreinte : lancer backfill-sha256.sh --apply, puis inventory.sh, avant la copie"

# Objets déjà présents dans chaque zone : clé TAB taille TAB empreinte
zone_list_recursive "$BUNNY_PUBLIC_ZONE" BUNNY_PUBLIC_ZONE_KEY uploads | cut -f1-3 > "$work/public.tsv"
zone_list_recursive "$BUNNY_PRIVATE_ZONE" BUNNY_PRIVATE_ZONE_KEY uploads | cut -f1-3 > "$work/private.tsv"

log "copie vers Bunny : base « file_entity » vers $BUNNY_PUBLIC_ZONE (public) et $BUNNY_PRIVATE_ZONE (privé)"
present=0 sent=0 to_send=0 errors=0
while IFS=$'\t' read -r id key size sha mime; do
  if [ "$(key_zone_kind "$key")" = private ]; then
    zone="$BUNNY_PRIVATE_ZONE" keyvar=BUNNY_PRIVATE_ZONE_KEY listing="$work/private.tsv"
  else
    zone="$BUNNY_PUBLIC_ZONE" keyvar=BUNNY_PUBLIC_ZONE_KEY listing="$work/public.tsv"
  fi

  remote="$(awk -F'\t' -v k="$key" '$1 == k { print $2 "\t" $3; exit }' "$listing")"
  if [ "$remote" = "$size"$'\t'"$sha" ]; then
    present=$((present + 1))
    continue
  fi

  local_file="$UPLOADS_DIR/${key#uploads/}"
  if [ ! -f "$local_file" ]; then
    log "ABSENT : ligne $id, $key : fichier introuvable sur le disque (voir inventory.sh)"
    errors=$((errors + 1))
    continue
  fi
  if [ "$(stat -c %s "$local_file")" != "$size" ] || [ "$(sha256sum "$local_file" | cut -d' ' -f1)" != "$sha" ]; then
    log "DIVERGENT : ligne $id, $key : le fichier du disque ne correspond plus à sa ligne (taille ou empreinte)"
    errors=$((errors + 1))
    continue
  fi

  note=""
  [ -z "$remote" ] || note=" (objet présent, mais taille ou empreinte différente : remplacé)"
  if [ "$APPLY" != true ]; then
    log "à envoyer : $zone/$key, $size octets$note"
    to_send=$((to_send + 1))
    continue
  fi
  if zone_curl "$keyvar" --fail -H "Checksum: $(printf '%s' "$sha" | tr 'a-f' 'A-F')" \
       -H "Content-Type: ${mime:-application/octet-stream}" \
       --upload-file "$local_file" "$(zone_url "$zone" "$key")" > /dev/null; then
    sent=$((sent + 1))
    [ -z "$note" ] || log "remplacé : $zone/$key$note"
  else
    log "ÉCHEC : ligne $id, envoi de $zone/$key refusé ou impossible"
    errors=$((errors + 1))
  fi
done < "$work/rows.tsv"

log "lignes file_entity : $(wc -l < "$work/rows.tsv") ; déjà dans Bunny : $present ; envoyées : $sent ; erreurs : $errors"
if [ "$APPLY" != true ]; then
  log "SIMULATION : rien n'a été envoyé. $to_send objet(s) à envoyer. Relancer avec --apply."
fi
[ "$errors" -eq 0 ] || fail "copie incomplète : $errors ligne(s) en erreur, voir ci-dessus"
if [ "$APPLY" = true ]; then
  log "copie terminée : chaque ligne a son objet dans Bunny. Contrôler avec reconcile-bunny.sh"
fi
