package com.lumiedu.storage.repository;

import com.lumiedu.storage.entity.StorageCleanupScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StorageCleanupScanRepository extends JpaRepository<StorageCleanupScan, Long> {
    List<StorageCleanupScan> findByUserId(Long userId);
}
