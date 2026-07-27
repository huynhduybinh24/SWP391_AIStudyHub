package com.lumiedu.prompt.repository;

import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromptVersionRepository extends JpaRepository<PromptVersion, Long> {

    List<PromptVersion> findByPromptIdOrderByCreatedAtDesc(Long promptId);

    Optional<PromptVersion> findByPromptIdAndVersion(Long promptId, String version);

    Optional<PromptVersion> findByPromptIdAndStatus(Long promptId, PromptVersionStatus status);

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.code = :promptCode AND pv.status = 'PUBLISHED' AND pv.prompt.active = true")
    Optional<PromptVersion> findPublishedVersionByPromptCode(@Param("promptCode") String promptCode);

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.id = :promptId AND pv.status = 'PUBLISHED'")
    Optional<PromptVersion> findPublishedVersionByPromptId(@Param("promptId") Long promptId);

    boolean existsByPromptIdAndVersion(Long promptId, String version);
}
