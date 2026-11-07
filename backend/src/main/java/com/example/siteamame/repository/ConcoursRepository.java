package com.example.siteamame.repository;

import com.example.siteamame.dto.concours.ConcoursReponseDto;
import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import com.example.siteamame.model.Concours;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

/**
 * Le fichier d'un concours est facultatif : les trois listes passent par une jointure externe
 * (LEFT JOIN c.file f). Écrire « c.file.filePath » créerait une jointure interne implicite,
 * qui ferait disparaître des listes les concours sans fichier.
 */
public interface ConcoursRepository extends JpaRepository<Concours, Long> {

    @Query(value = "SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(" +
            "c.id, "+
            "c.nom, "+
            "c.description, "+
            "c.pays, "+
            "c.niveau, "+
            "c.status, "+
            "c.isAvalable, "+
            "c.dateOuverture, "+
            "c.dateLimite, "+
            "c.lienOfficiel, "+
            "f.filePath) "+
            "FROM Concours c LEFT JOIN c.file f " +
            "WHERE c.isAvalable = true "+
            "AND c.dateLimite >= :currentDate "+
            "ORDER BY c.dateLimite DESC",
           countQuery = "SELECT count(c) FROM Concours c " +
            "WHERE c.isAvalable = true "+
            "AND c.dateLimite >= :currentDate")
    Page<ConcoursReponseDto> findValideConcoursAvecPagination(
            @Param("currentDate") LocalDateTime currentDate,
            Pageable pageable
    );

    // Les deux filtres sont facultatifs et se cumulent. Chacun est entre parenthèses : sans elles,
    // le OR l'emportait sur les conditions de validité et renvoyait des concours expirés.
    @Query(value = "SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(" +
            "c.id, "+
            "c.nom, "+
            "c.description, "+
            "c.pays, "+
            "c.niveau, "+
            "c.status, "+
            "c.isAvalable, "+
            "c.dateOuverture, "+
            "c.dateLimite, "+
            "c.lienOfficiel, "+
            "f.filePath) "+
            "FROM Concours c LEFT JOIN c.file f " +
            "WHERE c.isAvalable = true "+
            "AND c.dateLimite >= :currentDate "+
            "AND (:niveau IS NULL OR c.niveau = :niveau) "+
            "AND (:status IS NULL OR c.status = :status) "+
            "ORDER BY c.dateLimite DESC",
           countQuery = "SELECT count(c) FROM Concours c " +
            "WHERE c.isAvalable = true "+
            "AND c.dateLimite >= :currentDate "+
            "AND (:niveau IS NULL OR c.niveau = :niveau) "+
            "AND (:status IS NULL OR c.status = :status)")
    Page<ConcoursReponseDto> findValideConcoursByNiveauOrByStatus(
            @Param("currentDate") LocalDateTime currentDate,
            @Param("niveau") NiveauType niveau,
            @Param("status") StatusType status,
            Pageable pageable
    );

    @Query(value = "SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(" +
            "c.id, "+
            "c.nom, "+
            "c.description, "+
            "c.pays, "+
            "c.niveau, "+
            "c.status, "+
            "c.isAvalable, "+
            "c.dateOuverture, "+
            "c.dateLimite, "+
            "c.lienOfficiel, "+
            "f.filePath) "+
            "FROM Concours c LEFT JOIN c.file f " +
            "WHERE c.isAvalable = true "+
            "AND c.dateLimite >= :currentDate "+
            "AND (LOWER(c.nom) LIKE LOWER(CONCAT('%', :search, '%')) "+
            "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) "+
            "OR LOWER(c.pays) LIKE LOWER(CONCAT('%', :search, '%'))) "+
            "ORDER BY c.dateLimite DESC",
           countQuery = "SELECT count(c) FROM Concours c " +
            "WHERE c.isAvalable = true "+
            "AND c.dateLimite >= :currentDate "+
            "AND (LOWER(c.nom) LIKE LOWER(CONCAT('%', :search, '%')) "+
            "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) "+
            "OR LOWER(c.pays) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ConcoursReponseDto> findValideConcoursBySearch(
            @Param("currentDate") LocalDateTime currentDate,
            @Param("search") String search,
            Pageable pageable
    );
}
