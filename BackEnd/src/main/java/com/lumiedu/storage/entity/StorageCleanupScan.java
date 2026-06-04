package com.lumiedu.storage.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.storage.enums.CleanupScanType;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "storage_cleanup_scans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageCleanupScan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "scan_type", nullable = false, length = 50)
    private CleanupScanType scanType;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // PENDING, RUNNING, COMPLETED, FAILED

    @Column(name = "files_found")
    @Builder.Default
    private Integer filesFound = 0;

    @Column(name = "space_reclaimed_mb")
    @Builder.Default
    private Double spaceReclaimedMb = 0.0;
}
