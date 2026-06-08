package com.lumiedu.workspace.dto;

import com.lumiedu.workspace.enums.WorkspaceAccessType;
import com.lumiedu.workspace.enums.WorkspaceMemberRole;
import lombok.Data;

public class WorkspaceRequests {

    @Data
    public static class CreateWorkspaceRequest {
        private String name;
        private String description;
        private WorkspaceAccessType accessType;
        private Long userId;
    }

    @Data
    public static class UpdateWorkspaceRequest {
        private String name;
        private String description;
        private WorkspaceAccessType accessType;
        private Boolean blockDownloadForViewers;
        private Long editorId;
    }

    @Data
    public static class InviteMemberRequest {
        private String email;
        private WorkspaceMemberRole role;
        private Long inviterId;
    }

    @Data
    public static class UpdateMemberRoleRequest {
        private WorkspaceMemberRole role;
        private Long editorId;
    }
}
