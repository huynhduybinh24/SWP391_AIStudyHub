package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
    List<StudyPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT sp FROM StudyPlan sp
            WHERE sp.userId = :userId
            AND LOWER(sp.subject) = LOWER(:subject)
            ORDER BY sp.createdAt DESC
            """)
    List<StudyPlan> findByUserIdAndSubjectOrderByCreatedAtDesc(@Param("userId") Long userId, @Param("subject") String subject);
}
