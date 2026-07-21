package com.lumiedu.workspace.dto;

import com.lumiedu.workspace.entity.SharedWorkspace;
import com.lumiedu.workspace.entity.WorkspaceAiReport;
import com.lumiedu.workspace.entity.WorkspaceMember;
import com.lumiedu.workspace.enums.WorkspaceAccessType;
import com.lumiedu.workspace.enums.WorkspaceMemberRole;
import com.lumiedu.workspace.enums.WorkspaceMemberStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class WorkspaceResponses {

    @Data
    @Builder
    public static class WorkspaceResponse {
        private Long id;
        private String name;
        private String description;
        private Long ownerId;
        private String ownerName;
        private WorkspaceAccessType accessType;
        private Boolean blockDownloadForViewers;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<WorkspaceMemberResponse> members;
        private List<WorkspaceDocumentResponse> documents;

        public static WorkspaceResponse fromEntity(SharedWorkspace workspace, String ownerName, List<WorkspaceMemberResponse> members, List<WorkspaceDocumentResponse> documents) {
            return WorkspaceResponse.builder()
                    .id(workspace.getId())
                    .name(workspace.getName())
                    .description(workspace.getDescription())
                    .ownerId(workspace.getOwnerId())
                    .ownerName(ownerName)
                    .accessType(workspace.getAccessType())
                    .blockDownloadForViewers(workspace.getBlockDownloadForViewers())
                    .createdAt(workspace.getCreatedAt())
                    .updatedAt(workspace.getUpdatedAt())
                    .members(members)
                    .documents(documents)
                    .build();
        }
    }

    @Data
    @Builder
    public static class WorkspaceMemberResponse {
        private Long id;
        private Long workspaceId;
        private Long userId;
        private String email;
        private String fullName;
        private WorkspaceMemberRole role;
        private WorkspaceMemberStatus status;

        public static WorkspaceMemberResponse fromEntity(WorkspaceMember member, String fullName) {
            return WorkspaceMemberResponse.builder()
                    .id(member.getId())
                    .workspaceId(member.getWorkspaceId())
                    .userId(member.getUserId())
                    .email(member.getEmail())
                    .fullName(fullName)
                    .role(member.getRole())
                    .status(member.getStatus())
                    .build();
        }
    }

    @Data
    @Builder
    public static class WorkspaceDocumentResponse {
        private Long id;
        private Long workspaceId;
        private Long documentId;
        private String title;
        private String fileName;
        private String originalFileName;
        private String fileUrl;
        private String fileType;
        private String mimeType;
        private Long fileSize;
        private Long addedBy;
        private String addedByName;
        private String addedByEmail;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class WorkspaceAiReportResponse {
        private Long id;
        private Long workspaceId;
        private String reportText;
        private String summaryText;
        private Long generatedBy;
        private String generatedByName;
        private LocalDateTime createdAt;

        public static WorkspaceAiReportResponse fromEntity(WorkspaceAiReport report, String generatedByName) {
            return WorkspaceAiReportResponse.builder()
                    .id(report.getId())
                    .workspaceId(report.getWorkspaceId())
                    .reportText(report.getReportText())
                    .summaryText(report.getSummaryText())
                    .generatedBy(report.getGeneratedBy())
                    .generatedByName(generatedByName)
                    .createdAt(report.getCreatedAt())
                    .build();
        }
    }
}
