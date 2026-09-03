package com.example.app.repository;

import com.example.app.model.Recruiter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecruiterRepository extends JpaRepository<Recruiter, Long> {
    Optional<Recruiter> findByUserEmail(String email);
    Optional<Recruiter> findByUserId(Long userId);
}
