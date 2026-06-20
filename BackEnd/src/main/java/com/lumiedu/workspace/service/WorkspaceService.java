package com.lumiedu.workspace.service;

import com.lumiedu.workspace.dto.WorkspaceRequests.*;
import com.lumiedu.workspace.dto.WorkspaceResponses.*;
import com.lumiedu.document.entity.Document;

import java.util.List;

public interface WorkspaceService {
    WorkspaceResponse createWorkspace(CreateWorkspaceRequest request);
    List<WorkspaceResponse> getUserWorkspaces(Long userId);
    WorkspaceResponse getWorkspaceById(Long id, Long userId);
    void inviteMember(Long workspaceId, InviteMemberRequest request);
    void respondToInvitation(Long workspaceId, Long userId, String action);
    void updateMemberRole(Long workspaceId, Long memberId, UpdateMemberRoleRequest request);
    void removeMember(Long workspaceId, Long memberId, Long requesterId);
    WorkspaceResponse updateWorkspaceAccess(Long id, UpdateWorkspaceRequest request);
    void shareDocumentToWorkspace(Long workspaceId, Long documentId, Long userId);
    void removeDocumentFromWorkspace(Long workspaceId, Long documentId, Long userId);
    Document importDocumentToPersonal(Long workspaceId, Long documentId, Long userId);
    WorkspaceAiReportResponse generateWorkspaceAiReport(Long workspaceId, Long userId);
    List<WorkspaceAiReportResponse> getWorkspaceAiReports(Long workspaceId, Long userId);
}
