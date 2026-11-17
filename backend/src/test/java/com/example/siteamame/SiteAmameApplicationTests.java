package com.example.siteamame;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.enumeration.RoleType;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Démarre l'application sur un PostgreSQL vide : Flyway y exécute toutes les migrations, puis
 * Hibernate (« validate ») vérifie que le schéma obtenu correspond aux entités. Si une entité
 * change sans migration, ou l'inverse, ce test échoue au démarrage du contexte.
 *
 * L'image suit la version de la base de production : PostgreSQL 15 tant qu'elle est sur le VPS,
 * 17 une fois sur Neon. Pour essayer une autre version sans modifier ce fichier :
 * {@code ./mvnw test -Dtest.postgres.image=postgres:17-alpine}. Docker est requis.
 */
@SpringBootTest
@Testcontainers
class SiteAmameApplicationTests {

	@Container
	@ServiceConnection
	static PostgreSQLContainer<?> postgres =
			new PostgreSQLContainer<>(System.getProperty("test.postgres.image", "postgres:15-alpine"));

	@Autowired
	private Flyway flyway;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void contextLoads() {
	}

	@Test
	void flywayCreatesTheWholeSchemaOnAnEmptyDatabase() {
		assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("4");
		assertThat(flyway.info().pending()).isEmpty();

		Integer tables = jdbcTemplate.queryForObject(
				"select count(*) from information_schema.tables where table_schema = 'public' "
						+ "and table_name <> 'flyway_schema_history'", Integer.class);
		// 25 tables de V1, plus storage_purge_queue (V3)
		assertThat(tables).isEqualTo(26);
	}

	/**
	 * Hibernate en « validate » ne contrôle pas les contraintes CHECK des colonnes d'énumération.
	 * En production, ADHESION_MANAGE manquait à celle de user_permission (écart E47) : toute
	 * nouvelle valeur d'énumération doit arriver avec une migration qui recrée la contrainte.
	 */
	@Test
	void enumCheckConstraintsListEveryValueOfTheCode() {
		String roles = checkDefinition("users_role_check");
		for (RoleType role : RoleType.values()) {
			assertThat(roles).contains("'" + role.name() + "'");
		}
		String permissions = checkDefinition("user_permission_permission_check");
		for (Permission permission : Permission.values()) {
			assertThat(permissions).contains("'" + permission.name() + "'");
		}
	}

	private String checkDefinition(String constraintName) {
		return jdbcTemplate.queryForObject(
				"select pg_get_constraintdef(oid) from pg_constraint where conname = ?",
				String.class, constraintName);
	}
}
