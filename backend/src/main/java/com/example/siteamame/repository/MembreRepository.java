package com.example.siteamame.repository;

import com.example.siteamame.model.Membre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembreRepository extends JpaRepository<Membre, Long> {
    List<Membre> findByIsActifTrueOrderByOrdreAscNomAsc();
}
