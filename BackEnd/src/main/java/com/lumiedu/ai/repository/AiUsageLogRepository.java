package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {
    long countByUserIdAndFeatureTypeAndUsageDate(Long userId, String featureType, LocalDate usageDate);
}
