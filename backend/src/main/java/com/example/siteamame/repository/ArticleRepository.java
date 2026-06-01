package com.example.siteamame.repository;

import com.example.siteamame.model.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Query("SELECT DISTINCT a.categorie FROM Article a WHERE a.estPublie = true")
    List<String> findDistinctCategories();

    @Query("SELECT COUNT(a) FROM Article a WHERE a.estPublie = true AND a.categorie = :categorie")
    Long countByCategorie(@Param("categorie") String categorie);

    @Modifying
    @Query("UPDATE Article a SET a.vues = a.vues + 1 WHERE a.id = :id")
    void incrementViews(@Param("id") Long id);

    // ── Détail (tags + file) ──────────────────────────────────────────────────

    @EntityGraph(attributePaths = {"tags", "file"})
    Optional<Article> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"tags", "file"})
    Optional<Article> findWithDetailsBySlug(String slug);

    // ── Listes non-paginées (utilisées par popular, similar, categorie) ───────

    @EntityGraph(attributePaths = {"file"})
    List<Article> findByEstPublieTrueOrderByDatePublicationDesc();

    @EntityGraph(attributePaths = {"file"})
    List<Article> findByEstPublieTrueOrderByVuesDesc();

    @EntityGraph(attributePaths = {"file"})
    List<Article> findByCategorieAndEstPublieTrue(String categorie);

    @Query("SELECT a FROM Article a WHERE a.estPublie = true AND (" +
            "LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.auteur) LIKE LOWER(CONCAT('%', :search, '%')))")
    @EntityGraph(attributePaths = {"file"})
    List<Article> searchArticles(@Param("search") String search);

    @Query("SELECT a FROM Article a WHERE a.estPublie = true AND (" +
            "LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.auteur) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND a.categorie = :categorie")
    @EntityGraph(attributePaths = {"file"})
    List<Article> searchArticlesByCategorie(@Param("search") String search,
                                            @Param("categorie") String categorie);

    // ── Liste paginée avec filtres optionnels (recherche + catégorie) ─────────
    // file est une association to-one : @EntityGraph safe avec Pageable.
    // countQuery explicite pour éviter que Spring Data n'applique l'EntityGraph au COUNT.

    // :search = '' signifie "pas de filtre texte" — évite le problème PostgreSQL
    // où :search IS NULL ferait inférer le type bytea au lieu de text.
    @Query(value = "SELECT a FROM Article a WHERE a.estPublie = true " +
            "AND (:categorie = 'all' OR a.categorie = :categorie) " +
            "AND (:search = '' OR " +
            "     LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.auteur) LIKE LOWER(CONCAT('%', :search, '%')))",
           countQuery = "SELECT count(a) FROM Article a WHERE a.estPublie = true " +
            "AND (:categorie = 'all' OR a.categorie = :categorie) " +
            "AND (:search = '' OR " +
            "     LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.auteur) LIKE LOWER(CONCAT('%', :search, '%')))")
    @EntityGraph(attributePaths = {"file"})
    Page<Article> findPagedWithFilters(@Param("categorie") String categorie,
                                       @Param("search") String search,
                                       Pageable pageable);

    // ── Liste paginée admin (tous statuts, pas de filtre estPublie) ──────────
    @Query(value = "SELECT a FROM Article a WHERE " +
            "(:categorie = 'all' OR a.categorie = :categorie) " +
            "AND (:search = '' OR " +
            "     LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.auteur) LIKE LOWER(CONCAT('%', :search, '%')))",
           countQuery = "SELECT count(a) FROM Article a WHERE " +
            "(:categorie = 'all' OR a.categorie = :categorie) " +
            "AND (:search = '' OR " +
            "     LOWER(a.titre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.contenu) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.auteur) LIKE LOWER(CONCAT('%', :search, '%')))")
    @EntityGraph(attributePaths = {"file"})
    Page<Article> findAllPagedAdmin(@Param("categorie") String categorie,
                                    @Param("search") String search,
                                    Pageable pageable);

    // Compatibilité (ancien slug lookup)
    Optional<Article> findBySlug(String slug);
}
