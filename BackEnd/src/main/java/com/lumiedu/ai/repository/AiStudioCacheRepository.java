package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.AiStudioCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiStudioCacheRepository extends JpaRepository<AiStudioCache, Long> {
    Optional<AiStudioCache> findByCacheKeyAndFeatureTypeAndLanguage(String cacheKey, String featureType, String language);
}
