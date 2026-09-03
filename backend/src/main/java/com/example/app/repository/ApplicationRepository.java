package com.example.app.repository;

import com.example.app.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByCandidateUserEmailOrderByAppliedAtDesc(String email);
    List<Application> findByCandidateIdOrderByAppliedAtDesc(Long candidateId);
    List<Application> findByJobIdOrderByAppliedAtDesc(Long jobId);
    List<Application> findAllByOrderByAppliedAtDesc();
    Optional<Application> findByIdAndCandidateUserEmail(Long id, String email);
}
