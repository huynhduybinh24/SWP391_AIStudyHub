package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_studio_caches", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"cache_key", "feature_type", "language"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiStudioCache extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cache_key", nullable = false)
    private String cacheKey;

    @Column(name = "feature_type", length = 30, nullable = false)
    private String featureType;

    @Column(name = "language", length = 10, nullable = false)
    private String language;

    @Column(name = "cached_response", columnDefinition = "LONGTEXT", nullable = false)
    private String cachedResponse;
}
