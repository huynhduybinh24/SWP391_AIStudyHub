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

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.id = :promptId ORDER BY pv.createdAt DESC")
    List<PromptVersion> findByPromptIdOrderByCreatedAtDesc(@Param("promptId") Long promptId);

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.id = :promptId AND pv.version = :version")
    Optional<PromptVersion> findByPromptIdAndVersion(@Param("promptId") Long promptId, @Param("version") String version);

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.id = :promptId AND pv.status = :status")
    Optional<PromptVersion> findByPromptIdAndStatus(@Param("promptId") Long promptId, @Param("status") PromptVersionStatus status);

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.code = :promptCode AND pv.status = 'PUBLISHED' AND pv.prompt.active = true")
    Optional<PromptVersion> findPublishedVersionByPromptCode(@Param("promptCode") String promptCode);

    @Query("SELECT pv FROM PromptVersion pv WHERE pv.prompt.id = :promptId AND pv.status = 'PUBLISHED'")
    Optional<PromptVersion> findPublishedVersionByPromptId(@Param("promptId") Long promptId);

    @Query("SELECT CASE WHEN COUNT(pv) > 0 THEN true ELSE false END FROM PromptVersion pv WHERE pv.prompt.id = :promptId AND pv.version = :version")
    boolean existsByPromptIdAndVersion(@Param("promptId") Long promptId, @Param("version") String version);
}
