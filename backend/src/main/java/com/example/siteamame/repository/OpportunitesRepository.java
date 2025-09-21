package com.example.siteamame.repository;

import com.example.siteamame.dto.OpportunitesDto;
import com.example.siteamame.model.Opportunites;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface OpportunitesRepository extends JpaRepository<Opportunites, Long> {

    /**
     * Récupère les opportunités actives et les retourne directement sous forme de DTO.
     * Utilise une "Constructor Expression" de JPQL.
     */
    @Query("SELECT new com.example.siteamame.dto.OpportunitesDto(" + // <-- La magie est ici
            "   o.id," +
            "   o.titre," +
            "   o.descriptionComplete, " + // Assurez-vous d'avoir une colonne 'description' et non 'descriptionComplete'
            "   o.urlSource," +
            "   o.urlPdf1," +
            "   o.urlPdf2," +
            "   o.sourceSite," +
            "   o.paysOffrant," +
            "   o.urlDrapeau," +
            "   o.anneePertinence) " +
            "FROM Opportunites o " + // "o" est un alias pour l'entité Opportunites
            "WHERE (o.anneePertinence IS NULL AND o.dateScraping >= :recentThresholdDate) OR (o.anneePertinence >= :currentYear) " +
            "ORDER BY o.dateScraping DESC, o.id DESC")
    List<OpportunitesDto> findActiveOpportunites(@Param("currentYear") Integer currentYear, @Param("recentThresholdDate") Date recentThresholdDate);

}