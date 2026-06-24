package com.lumiedu.document.repository;

import com.lumiedu.document.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    @Query("SELECT s FROM Subject s WHERE s.semesterName = :semesterName AND (s.userId IS NULL OR s.userId = :userId)")
    List<Subject> findBySemesterNameAndUserScope(@Param("semesterName") String semesterName, @Param("userId") Long userId);

    @Query("SELECT s FROM Subject s WHERE s.userId IS NULL OR s.userId = :userId")
    List<Subject> findAllByUserScope(@Param("userId") Long userId);

    Optional<Subject> findByCodeAndUserId(String code, Long userId);

    Optional<Subject> findByCodeAndUserIdIsNull(String code);
}
