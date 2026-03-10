package com.example.siteamame.repository;

import com.example.siteamame.dto.bourse.BourseSummaryDto;
import com.example.siteamame.model.Bourse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface BourseRepository extends JpaRepository<Bourse, Long> {

    @Query("SELECT new com.example.siteamame.dto.bourse.BourseSummaryDto("
            + " b.id, "
            + " b.titre, "
            + " b.descriptionCourte, "
            + " b.bailleur, "
            + " b.paysHote, "
            + " b.niveau, "
            + " b.categorie, "
            + " b.financementStatut, "
            + " b.organisation, "
            + " b.dateLimite) "
            + "FROM Bourse b "
            + "WHERE (b.dateLimite IS NOT NULL AND b.dateLimite >= :currentDate) "
            + "ORDER BY b.dateLimite ASC")
    Page<BourseSummaryDto> findValideBoursesAvecPagination(@Param("currentDate") LocalDate currentDate, Pageable pageable);

    // Filtre par categorie, niveau, pays-hote
    @Query("SELECT new com.example.siteamame.dto.bourse.BourseSummaryDto("
            + " b.id, "
            + " b.titre, "
            + " b.descriptionCourte, "
            + " b.bailleur, "
            + " b.paysHote, "
            + " b.niveau, "
            + " b.categorie, "
            + " b.financementStatut, "
            + " b.organisation, "
            + " b.dateLimite) "
            + "FROM Bourse b "
            + "WHERE b.dateLimite >= :currentDate "
            + "AND (b.categorie = :categorie "
            + "OR b.niveau = :niveau "
            + "OR b.paysHote = :pays) "
            + "ORDER BY b.dateLimite ASC")
    Page<BourseSummaryDto> findValideAndFilteredBourse(
            @Param("currentDate") LocalDate currentDate,
            @Param("categorie") String categorie,
            @Param("niveau") String niveau,
            @Param("pays") String pays,
            Pageable pageable);

    @Query("""
SELECT new com.example.siteamame.dto.bourse.BourseSummaryDto(
    b.id,
    b.titre,
    b.descriptionCourte,
    b.bailleur,
    b.paysHote,
    b.niveau,
    b.categorie,
    b.financementStatut,
    b.organisation,
    b.dateLimite
)
FROM Bourse b
WHERE b.dateLimite >= :currentDate
AND (
    (:titre IS NOT NULL AND LOWER(b.titre) LIKE LOWER(CONCAT('%', :titre, '%')))
    OR (:description IS NOT NULL AND LOWER(b.descriptionCourte) LIKE LOWER(CONCAT('%', :description, '%')))
    OR (:pays IS NOT NULL AND LOWER(b.paysHote) LIKE LOWER(CONCAT('%', :pays, '%')))
)
ORDER BY b.dateLimite ASC
""")
    Page<BourseSummaryDto> findBySearchBourses(
            @Param("currentDate") LocalDate currentDate,
            @Param("titre") String titre,
            @Param("description") String description,
            @Param("pays") String pays,
            Pageable pageable
    );
}
