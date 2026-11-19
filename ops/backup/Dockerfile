# Image d'exploitation AMAME (stack « amame-ops ») : sauvegardes planifiées et opérations ponctuelles.
#
# Basée sur l'image PostgreSQL : elle fournit pg_dump et pg_restore, ainsi qu'un serveur
# que le test de restauration démarre comme environnement jetable.
#
# PG_MAJOR doit être la version majeure de la base sauvegardée : pg_dump refuse une base
# plus récente que lui, et un dump se restaure sans surprise dans la version qui l'a produit.
# 18 : la version du projet Neon, base de production depuis le 19 novembre 2026 (15 auparavant, sur le VPS).
#
# La version MINEURE compte aussi : construire avec « docker build --pull », et reconstruire l'image
# dès que la base passe à une version mineure plus récente. Un pg_dump plus ancien que le serveur
# peut produire un dump que son propre serveur de test refuse : PostgreSQL 15.20 marque les colonnes
# « pg_attver », qu'un pg_dump 15.19 recopie et qu'un serveur 15.19 rejette (constat C16).
ARG PG_MAJOR=18
FROM postgres:${PG_MAJOR}-alpine

# file : type MIME des fichiers anciens qui n'en ont pas (backfill-sha256.sh)
RUN apk add --no-cache bash coreutils curl file findutils gnupg jq

COPY --chmod=755 lib.sh backup.sh restore-test.sh restore-db.sh restore-files.sh entrypoint.sh \
     inventory.sh backfill-sha256.sh delete-orphan-rows.sh copy-to-bunny.sh copy-from-bunny.sh reconcile-bunny.sh \
     db-transfer.sh db-compare.sh /usr/local/bin/
COPY --chmod=644 db-grants.sql /usr/local/share/amame/
# Protège d'une extraction Git en fins de ligne Windows, qui rendrait les scripts inexécutables
RUN cd /usr/local/bin && sed -i 's/\r$//' lib.sh backup.sh restore-test.sh restore-db.sh restore-files.sh entrypoint.sh \
      inventory.sh backfill-sha256.sh delete-orphan-rows.sh copy-to-bunny.sh copy-from-bunny.sh reconcile-bunny.sh \
      db-transfer.sh db-compare.sh \
 && sed -i 's/\r$//' /usr/local/share/amame/db-grants.sql \
 && chmod 755 /usr/local/share/amame

# Aucun privilège root : ni les sauvegardes ni l'instance PostgreSQL temporaire n'en ont besoin
USER postgres
WORKDIR /tmp

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
