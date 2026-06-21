package com.lumiedu.document.repository;

import com.lumiedu.document.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {

    @Query("SELECT s FROM Semester s WHERE s.userId IS NULL OR s.userId = :userId")
    List<Semester> findAllByUserScope(@Param("userId") Long userId);

    Optional<Semester> findByNameAndUserId(String name, Long userId);

    Optional<Semester> findByNameAndUserIdIsNull(String name);
}
