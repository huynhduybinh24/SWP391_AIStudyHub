package com.lumiedu.prompt.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.prompt.enums.PromptCategory;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prompts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prompt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private PromptCategory category;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;
}
