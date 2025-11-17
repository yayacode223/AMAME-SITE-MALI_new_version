package com.example.siteamame.repository;

import com.example.siteamame.model.Filiere;
import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {

    List<Filiere> findByDomaine(DomaineFiliereSerieType domaine);

    @Query("SELECT f FROM Filiere f WHERE " +
            "LOWER(f.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionCourte) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(f.descriptionLongue) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Filiere> findBySearchTerm(@Param("searchTerm") String searchTerm);

    List<Filiere> findAllByOrderByNomAsc();
}