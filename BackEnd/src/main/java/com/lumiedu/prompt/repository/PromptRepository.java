package com.lumiedu.prompt.repository;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.enums.PromptCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromptRepository extends JpaRepository<Prompt, Long> {

    @Query("SELECT p FROM Prompt p WHERE p.code = :code")
    Optional<Prompt> findByCode(@Param("code") String code);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Prompt p WHERE p.code = :code")
    boolean existsByCode(@Param("code") String code);

    @Query("SELECT p FROM Prompt p WHERE p.category = :category")
    List<Prompt> findByCategory(@Param("category") PromptCategory category);

    @Query("SELECT p FROM Prompt p WHERE p.active = true")
    List<Prompt> findByActiveTrue();
}
