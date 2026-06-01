package com.example.siteamame.repository;

import com.example.siteamame.model.Don;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonRepository extends JpaRepository<Don, Long> {
    List<Don> findByUserIdOrderByDateDonDesc(Long userId);
}
