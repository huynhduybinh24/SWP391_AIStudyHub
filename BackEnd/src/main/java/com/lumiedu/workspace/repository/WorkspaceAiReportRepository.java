package com.lumiedu.workspace.repository;

import com.lumiedu.workspace.entity.WorkspaceAiReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkspaceAiReportRepository extends JpaRepository<WorkspaceAiReport, Long> {

    List<WorkspaceAiReport> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
}
