package com.lumiedu.auth.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.auth.enums.ProviderType;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "third_party_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false)
    private ProviderType providerType;

    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;

    @Column(name = "provider_email", nullable = false)
    private String providerEmail;

    @Column(name = "linked_at")
    @Builder.Default
    private LocalDateTime linkedAt = LocalDateTime.now();
}
