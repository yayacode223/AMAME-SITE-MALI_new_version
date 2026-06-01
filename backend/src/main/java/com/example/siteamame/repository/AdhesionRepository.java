package com.example.siteamame.repository;

import com.example.siteamame.enumeration.AdhesionStatus;
import com.example.siteamame.model.Adhesion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdhesionRepository extends JpaRepository<Adhesion, Long> {

    Optional<Adhesion> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndStatusIn(Long userId, List<AdhesionStatus> statuses);

    Page<Adhesion> findByStatus(AdhesionStatus status, Pageable pageable);

    long countByStatus(AdhesionStatus status);
}
