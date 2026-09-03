package com.example.app.repository;

import com.example.app.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    Optional<Interview> findByApplicationId(Long applicationId);
    List<Interview> findByApplicationCandidateUserEmailOrderByScheduledAtAsc(String email);
    List<Interview> findAllByOrderByScheduledAtAsc();
}
