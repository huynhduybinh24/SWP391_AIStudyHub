package com.lumiedu.notification.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.notification.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "document_name")
    private String documentName;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "action_type")
    private String actionType; // "removed", "rejected", "approved", "system"

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "action_text")
    private String actionText;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "avatar")
    private String avatar;

    @Column(name = "quote", columnDefinition = "TEXT")
    private String quote;
}
