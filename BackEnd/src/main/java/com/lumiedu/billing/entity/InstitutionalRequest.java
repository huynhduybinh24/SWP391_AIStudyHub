package com.lumiedu.billing.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.billing.enums.InstitutionalRequestStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "institutional_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionalRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_name", nullable = false)
    private String requesterName;

    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @Column(name = "organization_name", nullable = false)
    private String organizationName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "expected_users")
    private Integer expectedUsers;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InstitutionalRequestStatus status;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;
}
