package com.lumiedu.document.repository;

import com.lumiedu.document.entity.AudioRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudioRecordRepository extends JpaRepository<AudioRecord, Long> {

    List<AudioRecord> findAllByDocumentId(Long documentId);
}
