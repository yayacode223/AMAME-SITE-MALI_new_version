package com.example.siteamame.repository;

import com.example.siteamame.dto.EtablissementDto;
import com.example.siteamame.model.Etablissement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EtablissementRepository extends JpaRepository<Etablissement, Long> {
    @Query("SELECT new com.example.siteamame.dto.EtablissementDto(" +
            "e.id, " +
            "e.nom, " +
            "e.typeEtablissement, " +
            "e.lieu, " +
            "e.urlDetailEtablissement, " +
            "e.urlLogo, " +
            "e.urlImage" +
            ") FROM Etablissement e ORDER BY e.nom ASC")
    List<EtablissementDto> findAllEtablissementsAsDTO();
}
