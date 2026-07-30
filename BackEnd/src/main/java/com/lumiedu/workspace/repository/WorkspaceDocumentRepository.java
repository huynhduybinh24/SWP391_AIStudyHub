package com.lumiedu.workspace.repository;

import com.lumiedu.workspace.entity.WorkspaceDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceDocumentRepository extends JpaRepository<WorkspaceDocument, Long> {

    List<WorkspaceDocument> findByWorkspaceId(Long workspaceId);

    Optional<WorkspaceDocument> findByWorkspaceIdAndDocumentId(Long workspaceId, Long documentId);

    List<WorkspaceDocument> findByDocumentId(Long documentId);

    boolean existsByWorkspaceIdAndDocumentId(Long workspaceId, Long documentId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(wd) > 0 FROM WorkspaceDocument wd
            JOIN Document d ON wd.documentId = d.id
            WHERE wd.workspaceId = :workspaceId
            AND d.deleted = false
            AND d.checksum = :checksum
            """)
    boolean existsByWorkspaceIdAndChecksum(
            @org.springframework.data.repository.query.Param("workspaceId") Long workspaceId,
            @org.springframework.data.repository.query.Param("checksum") String checksum
    );
}
