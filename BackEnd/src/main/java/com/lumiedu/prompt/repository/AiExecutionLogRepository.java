package com.lumiedu.prompt.repository;

import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.enums.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiExecutionLogRepository extends JpaRepository<AiExecutionLog, Long>, JpaSpecificationExecutor<AiExecutionLog> {
    Page<AiExecutionLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    @org.springframework.data.jpa.repository.Query("SELECT a FROM AiExecutionLog a WHERE a.promptVersionEntity.id = :promptVersionId")
    List<AiExecutionLog> findByPromptVersionId(@org.springframework.data.repository.query.Param("promptVersionId") Long promptVersionId);
    Page<AiExecutionLog> findByStatus(ExecutionStatus status, Pageable pageable);
}
