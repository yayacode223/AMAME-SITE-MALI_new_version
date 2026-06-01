package com.example.siteamame.repository;

import com.example.siteamame.model.Filiere;
import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {

    List<Filiere> findByDomaine(DomaineFiliereSerieType domaine);

    @Query("SELECT f FROM Filiere f WHERE " +
            "LOWER(f.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionCourte) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionLongue) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    @EntityGraph(attributePaths = {"debouches", "file"})
    List<Filiere> findBySearchTerm(@Param("searchTerm") String searchTerm);

    @EntityGraph(attributePaths = {"debouches", "competences", "universites", "prerequis", "file"})
    Optional<Filiere> findWithDetailsById(Long id);

    // Pour les listes avec un minimum de collections
    @EntityGraph(attributePaths = {"debouches", "file"})
    List<Filiere> findAllByOrderByNomAsc();

    // ── Listes paginées ───────────────────────────────────────────────────────
    // debouches est @ElementCollection (collection) : ne PAS l'inclure dans
    // l'EntityGraph des requêtes paginées — Hibernate ferait une pagination
    // en mémoire. debouches sera chargé lazily dans le contexte @Transactional.

    @Query(value = "SELECT f FROM Filiere f",
           countQuery = "SELECT count(f) FROM Filiere f")
    @EntityGraph(attributePaths = {"file"})
    Page<Filiere> findAllPaged(Pageable pageable);

    @Query(value = "SELECT f FROM Filiere f WHERE f.domaine = :domaine",
           countQuery = "SELECT count(f) FROM Filiere f WHERE f.domaine = :domaine")
    @EntityGraph(attributePaths = {"file"})
    Page<Filiere> findByDomainePaged(@Param("domaine") DomaineFiliereSerieType domaine, Pageable pageable);

    @Query(value = "SELECT f FROM Filiere f WHERE " +
            "LOWER(f.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionCourte) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionLongue) LIKE LOWER(CONCAT('%', :searchTerm, '%'))",
           countQuery = "SELECT count(f) FROM Filiere f WHERE " +
            "LOWER(f.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionCourte) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionLongue) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    @EntityGraph(attributePaths = {"file"})
    Page<Filiere> findBySearchTermPaged(@Param("searchTerm") String searchTerm, Pageable pageable);
}