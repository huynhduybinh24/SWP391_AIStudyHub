package com.lumiedu.billing.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.billing.enums.PlanType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false)
    private PlanType planType;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "storage_limit_mb")
    private Long storageLimitMb;

    @Column(name = "max_documents")
    private Integer maxDocuments;

    @Column(name = "ai_chat_limit_per_day")
    private Integer aiChatLimitPerDay;

    @Column(name = "quiz_limit_per_day")
    private Integer quizLimitPerDay;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}
