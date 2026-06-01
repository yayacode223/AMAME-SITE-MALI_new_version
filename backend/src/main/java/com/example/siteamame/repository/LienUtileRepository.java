package com.example.siteamame.repository;

import com.example.siteamame.model.LienUtile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LienUtileRepository extends JpaRepository<LienUtile, Long> {
    List<LienUtile> findByIsActifTrueOrderByOrdreAscTitreAsc();
}
