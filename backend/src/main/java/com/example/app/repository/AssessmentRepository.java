package com.example.app.repository;

import com.example.app.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    Optional<Assessment> findByApplicationId(Long applicationId);
}
