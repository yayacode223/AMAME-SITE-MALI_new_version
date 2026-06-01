package com.example.siteamame.repository;

import com.example.siteamame.dto.etablissement.EtablissementDto;
import com.example.siteamame.model.Etablissement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EtablissementRepository extends JpaRepository<Etablissement, Long> {
    @Query("SELECT new com.example.siteamame.dto.etablissement.EtablissementDto(" +
            "e.id, e.nom, e.typeEtablissement, e.lieu, " +
            "e.urlDetailEtablissement, e.urlLogo, e.urlImage" +
            ") FROM Etablissement e ORDER BY e.nom ASC")
    List<EtablissementDto> findAllEtablissementsAsDTO();

    @Query(value = "SELECT new com.example.siteamame.dto.etablissement.EtablissementDto(" +
            "e.id, e.nom, e.typeEtablissement, e.lieu, " +
            "e.urlDetailEtablissement, e.urlLogo, e.urlImage" +
            ") FROM Etablissement e",
           countQuery = "SELECT count(e) FROM Etablissement e")
    Page<EtablissementDto> findAllEtablissementsPagedAsDTO(Pageable pageable);
}
