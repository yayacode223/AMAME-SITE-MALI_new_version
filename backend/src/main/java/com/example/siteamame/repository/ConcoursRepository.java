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

public interface ConcoursRepository extends JpaRepository<Concours, Long> {

    @Query("SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(" +
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
            "c.file.filePath) "+
            "FROM Concours c " +
            "WHERE (c.isAvalable = true) "+
            "AND (c.dateLimite >= :currentDate) "+
            "ORDER BY c.dateLimite DESC")
    Page<ConcoursReponseDto> findValideConcoursAvecPagination(
            @Param("currentDate") LocalDateTime currentDate,
            Pageable pageable
    );

    @Query("SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(" +
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
            "c.file.filePath) "+
            "FROM Concours c " +
            "WHERE (c.isAvalable = true) "+
            "AND (c.dateLimite >= :currentDate) "+
            "AND (:niveau IS NULL OR c.niveau = :niveau) "+
            "OR (:status IS NULL OR c.status = :status) "+
            "ORDER BY c.dateLimite DESC")
    Page<ConcoursReponseDto> findValideConcoursByNiveauOrByStatus(
            @Param("currentDate") LocalDateTime currentDate,
            @Param("niveau") NiveauType niveau,
            @Param("status") StatusType status,
            Pageable pageable
    );

    @Query("SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(" +
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
            "c.file.filePath) "+
            "FROM Concours c " +
            "WHERE (c.isAvalable = true) "+
            "AND (c.dateLimite >= :currentDate) "+
            "AND (LOWER(c.nom) LIKE LOWER(CONCAT('%', :search, '%'))) "+
            "OR (LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%'))) "+
            "OR (LOWER(c.pays) LIKE LOWER(CONCAT('%', :search, '%'))) "+
            "ORDER BY c.dateLimite DESC")
    Page<ConcoursReponseDto> findValideConcoursBySearch(
            @Param("currentDate") LocalDateTime currentDate,
            @Param("search") String search,
            Pageable pageable
    );

}


