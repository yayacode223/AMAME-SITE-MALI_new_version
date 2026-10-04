# Image d'exploitation AMAME (stack « amame-ops ») : sauvegardes planifiées et opérations ponctuelles.
#
# Basée sur l'image PostgreSQL : elle fournit pg_dump et pg_restore, ainsi qu'un serveur
# que le test de restauration démarre comme environnement jetable.
#
# PG_MAJOR doit être la version majeure de la base sauvegardée : pg_dump refuse une base
# plus récente que lui, et un dump se restaure sans surprise dans la version qui l'a produit.
# 15 tant que la base est sur le VPS ; 17 à partir de la bascule vers Neon.
ARG PG_MAJOR=15
FROM postgres:${PG_MAJOR}-alpine

RUN apk add --no-cache bash coreutils curl findutils gnupg jq

COPY --chmod=755 lib.sh backup.sh restore-test.sh restore-db.sh restore-files.sh entrypoint.sh /usr/local/bin/
# Protège d'une extraction Git en fins de ligne Windows, qui rendrait les scripts inexécutables
RUN cd /usr/local/bin && sed -i 's/\r$//' lib.sh backup.sh restore-test.sh restore-db.sh restore-files.sh entrypoint.sh

# Aucun privilège root : ni les sauvegardes ni l'instance PostgreSQL temporaire n'en ont besoin
USER postgres
WORKDIR /tmp

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
