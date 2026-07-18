package com.lumiedu.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "ai_usage_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "feature_type", nullable = false, length = 50)
    private String featureType; // e.g., CHAT, SUMMARY, QUIZ, STUDY_PLAN

    @Column(name = "model", nullable = false, length = 50)
    private String model; // e.g., gpt-4o-mini

    @Column(name = "prompt_tokens", nullable = false)
    private Integer promptTokens;

    @Column(name = "completion_tokens", nullable = false)
    private Integer completionTokens;

    @Column(name = "cost_estimate", precision = 10, scale = 6, nullable = false)
    private BigDecimal costEstimate;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;
}
