package com.example.siteamame.repository;

import com.example.siteamame.model.Partenaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartenaireRepository extends JpaRepository<Partenaire, Long> {
    List<Partenaire> findByIsActifTrueOrderByOrdreAscNomAsc();
}
