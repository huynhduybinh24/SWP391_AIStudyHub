package com.lumiedu.workspace.controller;

import com.lumiedu.workspace.dto.ApiResponse;
import com.lumiedu.workspace.dto.WorkspaceRequests.*;
import com.lumiedu.workspace.dto.WorkspaceResponses.*;
import com.lumiedu.workspace.service.WorkspaceService;
import com.lumiedu.document.entity.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(@RequestBody CreateWorkspaceRequest request) {
        try {
            WorkspaceResponse response = workspaceService.createWorkspace(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Workspace created successfully.", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getUserWorkspaces(@RequestParam Long userId) {
        try {
            List<WorkspaceResponse> response = workspaceService.getUserWorkspaces(userId);
            return ResponseEntity.ok(ApiResponse.ok("Workspaces retrieved successfully.", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        try {
            WorkspaceResponse response = workspaceService.getWorkspaceById(id, userId);
            return ResponseEntity.ok(ApiResponse.ok("Workspace details retrieved successfully.", response));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspaceAccess(
            @PathVariable Long id,
            @RequestBody UpdateWorkspaceRequest request) {
        try {
            WorkspaceResponse response = workspaceService.updateWorkspaceAccess(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Workspace settings updated successfully.", response));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<ApiResponse<Void>> inviteMember(
            @PathVariable Long id,
            @RequestBody InviteMemberRequest request) {
        try {
            workspaceService.inviteMember(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Invitation sent successfully.", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<ApiResponse<Void>> respondToInvitation(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String action) {
        try {
            workspaceService.respondToInvitation(id, userId, action);
            return ResponseEntity.ok(ApiResponse.ok("Invitation response registered successfully.", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestBody UpdateMemberRoleRequest request) {
        try {
            workspaceService.updateMemberRole(id, memberId, request);
            return ResponseEntity.ok(ApiResponse.ok("Member role updated successfully.", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestParam Long requesterId) {
        try {
            workspaceService.removeMember(id, memberId, requesterId);
            return ResponseEntity.ok(ApiResponse.ok("Member removed successfully.", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/documents/{documentId}")
    public ResponseEntity<ApiResponse<Void>> shareDocument(
            @PathVariable Long id,
            @PathVariable Long documentId,
            @RequestParam Long userId) {
        try {
            workspaceService.shareDocumentToWorkspace(id, documentId, userId);
            return ResponseEntity.ok(ApiResponse.ok("Document shared to workspace successfully.", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    public ResponseEntity<ApiResponse<Void>> removeDocument(
            @PathVariable Long id,
            @PathVariable Long documentId,
            @RequestParam Long userId) {
        try {
            workspaceService.removeDocumentFromWorkspace(id, documentId, userId);
            return ResponseEntity.ok(ApiResponse.ok("Document removed from workspace successfully.", null));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/documents/{documentId}/import")
    public ResponseEntity<ApiResponse<Document>> importDocument(
            @PathVariable Long id,
            @PathVariable Long documentId,
            @RequestParam Long userId) {
        try {
            Document imported = workspaceService.importDocumentToPersonal(id, documentId, userId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Document imported to personal workspace successfully.", imported));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/ai-report")
    public ResponseEntity<ApiResponse<WorkspaceAiReportResponse>> generateWorkspaceAiReport(
            @PathVariable Long id,
            @RequestParam Long userId) {
        try {
            WorkspaceAiReportResponse response = workspaceService.generateWorkspaceAiReport(id, userId);
            return ResponseEntity.ok(ApiResponse.ok("Workspace AI report generated successfully.", response));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/ai-reports")
    public ResponseEntity<ApiResponse<List<WorkspaceAiReportResponse>>> getWorkspaceAiReports(
            @PathVariable Long id,
            @RequestParam Long userId) {
        try {
            List<WorkspaceAiReportResponse> response = workspaceService.getWorkspaceAiReports(id, userId);
            return ResponseEntity.ok(ApiResponse.ok("Workspace AI reports retrieved successfully.", response));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
