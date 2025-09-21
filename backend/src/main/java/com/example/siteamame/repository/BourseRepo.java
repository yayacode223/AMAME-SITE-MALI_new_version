package com.example.siteamame.repository;

import com.example.siteamame.model.Bourse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BourseRepo extends JpaRepository<Bourse, Long> {
}
