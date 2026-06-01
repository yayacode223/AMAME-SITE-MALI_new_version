package com.example.siteamame.repository;

import com.example.siteamame.model.Cotisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CotisationRepository extends JpaRepository<Cotisation, Long> {
    List<Cotisation> findByUserIdOrderByAnneeDesc(Long userId);
    Optional<Cotisation> findByUserIdAndAnnee(Long userId, int annee);
}
