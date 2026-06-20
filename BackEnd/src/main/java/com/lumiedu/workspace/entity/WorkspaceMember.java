package com.lumiedu.workspace.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.workspace.enums.WorkspaceMemberRole;
import com.lumiedu.workspace.enums.WorkspaceMemberStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workspace_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private WorkspaceMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private WorkspaceMemberStatus status;
}
