package com.lumiedu.workspace.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.workspace.enums.WorkspaceAccessType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shared_workspaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedWorkspace extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, length = 20)
    private WorkspaceAccessType accessType;

    @Builder.Default
    @Column(name = "block_download_for_viewers", nullable = false)
    private Boolean blockDownloadForViewers = false;
}
