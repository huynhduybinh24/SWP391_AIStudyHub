package com.lumiedu.storage.repository;

import com.lumiedu.storage.entity.StorageAnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StorageAnalyticsSnapshotRepository extends JpaRepository<StorageAnalyticsSnapshot, Long> {
    List<StorageAnalyticsSnapshot> findByUserIdOrderBySnapshotDateAsc(Long userId);
}
