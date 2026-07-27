package com.lumiedu.prompt.repository;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.enums.PromptCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromptRepository extends JpaRepository<Prompt, Long> {
    Optional<Prompt> findByCode(String code);
    boolean existsByCode(String code);
    List<Prompt> findByCategory(PromptCategory category);
    List<Prompt> findByActiveTrue();
}
