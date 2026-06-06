package com.lumiedu.notification.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "broadcast_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BroadcastNotification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "type", nullable = false)
    private String type; // "system", "maintenance", "warning", "promotion"

    @Column(name = "target", nullable = false)
    private String target; // "all", "free", "pro"

    @Column(name = "recipients_count", nullable = false)
    private Integer recipientsCount;
}
