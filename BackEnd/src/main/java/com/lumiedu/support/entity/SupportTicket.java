package com.lumiedu.support.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.support.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "support_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Column(name = "user_id")
    private Long userId; // null if Guest
}
