package com.lumiedu.document.repository;

import com.lumiedu.document.entity.DocumentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentReportRepository extends JpaRepository<DocumentReport, Long> {
    List<DocumentReport> findAllByOrderByCreatedAtDesc();
}
