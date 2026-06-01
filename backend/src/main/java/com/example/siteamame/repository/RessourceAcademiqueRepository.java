package com.example.siteamame.repository;

import com.example.siteamame.model.RessourceAcademique;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RessourceAcademiqueRepository extends JpaRepository<RessourceAcademique, Long> {
    List<RessourceAcademique> findByIsActifTrueOrderByOrdreAscTitreAsc();

    Page<RessourceAcademique> findByIsActifTrue(Pageable pageable);
}
