package com.lumiedu.storage.service.impl;

import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.storage.dto.response.StorageAnalyticsResponse;
import com.lumiedu.storage.dto.response.StorageAnalyticsSnapshotResponse;
import com.lumiedu.storage.dto.response.StorageCleanupScanResponse;
import com.lumiedu.storage.dto.response.StorageUsageResponse;
import com.lumiedu.storage.entity.StorageAnalyticsSnapshot;
import com.lumiedu.storage.entity.StorageCleanupScan;
import com.lumiedu.storage.enums.CleanupScanType;
import com.lumiedu.storage.repository.StorageCleanupScanRepository;
import com.lumiedu.storage.repository.StorageRepository;
import com.lumiedu.storage.service.StorageService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class StorageServiceImpl implements StorageService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final StorageRepository storageRepository;
    private final StorageCleanupScanRepository storageCleanupScanRepository;
    private final com.lumiedu.billing.repository.UserSubscriptionRepository userSubscriptionRepository;

    private double calculateStorageLimit(User user) {
        double limitMb = user.getStorageLimitMb() != null ? user.getStorageLimitMb().doubleValue() : 1024.0;
        
        // Find active subscription plan to dynamically override limit
        var activeSub = userSubscriptionRepository.findFirstByUserIdAndStatusOrderByEndDateDesc(
                user.getId(), com.lumiedu.billing.enums.SubscriptionStatus.ACTIVE);
        
        if (activeSub.isPresent()) {
            var plan = activeSub.get().getSubscriptionPlan();
            if (plan != null && plan.getStorageLimitMb() != null) {
                limitMb = plan.getStorageLimitMb().doubleValue();
            }
        }
        
        if (user.getRole() == com.lumiedu.user.enums.UserRole.ADMIN) {
            limitMb = 51200.0; // 50 GB
        }
        
        return limitMb;
    }

    @Override
    @Transactional(readOnly = true)
    public StorageUsageResponse getStorageUsage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        double usedMb = user.getStorageUsedMb() != null ? user.getStorageUsedMb().doubleValue() : 0.0;
        double limitMb = calculateStorageLimit(user);
        double percentage = limitMb > 0.0 ? (usedMb * 100.0) / limitMb : 0.0;

        return StorageUsageResponse.builder()
                .userId(userId)
                .storageUsedMb(usedMb)
                .storageLimitMb(limitMb)
                .storagePercentage(Math.round(percentage * 100.0) / 100.0)
                .build();
    }

    @Override
    public StorageAnalyticsResponse getStorageAnalytics(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<Document> documents = documentRepository.findByUserId(userId);
        
        // Calculate breakdown size in MB
        Map<String, Double> categoryBreakdown = new HashMap<>();
        categoryBreakdown.put("Document", 0.0);
        categoryBreakdown.put("Media", 0.0);
        categoryBreakdown.put("Audio", 0.0);
        categoryBreakdown.put("Other", 0.0);

        int docCount = 0;
        int mediaCount = 0;
        int audioCount = 0;
        int otherCount = 0;

        for (Document doc : documents) {
            String category = getCategory(doc.getFileType());
            double sizeMb = (double) doc.getFileSize() / (1024.0 * 1024.0);
            categoryBreakdown.put(category, categoryBreakdown.get(category) + sizeMb);

            switch (category) {
                case "Document" -> docCount++;
                case "Media" -> mediaCount++;
                case "Audio" -> audioCount++;
                default -> otherCount++;
            }
        }

        // Round categories to 2 decimal places
        categoryBreakdown.forEach((key, val) -> categoryBreakdown.put(key, Math.round(val * 100.0) / 100.0));

        LocalDate today = LocalDate.now();
        List<StorageAnalyticsSnapshot> snapshots = storageRepository.findByUserIdOrderBySnapshotDateAsc(userId);
        
        boolean hasSnapshotForToday = snapshots.stream()
                .anyMatch(s -> s.getSnapshotDate().equals(today));

        double totalUsedMb = user.getStorageUsedMb() != null ? user.getStorageUsedMb().doubleValue() : 0.0;
        double limitMb = calculateStorageLimit(user);

        if (!hasSnapshotForToday) {
            StorageAnalyticsSnapshot newSnapshot = StorageAnalyticsSnapshot.builder()
                    .user(user)
                    .totalUsedMb(totalUsedMb)
                    .limitMb(limitMb)
                    .fileCount(documents.size())
                    .documentCount(docCount)
                    .mediaCount(mediaCount + audioCount) // combined audio and video/image into media or other
                    .otherCount(otherCount)
                    .snapshotDate(today)
                    .build();
            storageRepository.save(newSnapshot);
            snapshots.add(newSnapshot);
        }

        List<StorageAnalyticsSnapshotResponse> snapshotResponses = snapshots.stream()
                .map(s -> StorageAnalyticsSnapshotResponse.builder()
                        .id(s.getId())
                        .totalUsedMb(s.getTotalUsedMb())
                        .limitMb(s.getLimitMb())
                        .fileCount(s.getFileCount())
                        .documentCount(s.getDocumentCount())
                        .mediaCount(s.getMediaCount())
                        .otherCount(s.getOtherCount())
                        .snapshotDate(s.getSnapshotDate())
                        .build())
                .collect(Collectors.toList());

        return StorageAnalyticsResponse.builder()
                .totalUsedMb(totalUsedMb)
                .limitMb(limitMb)
                .totalFiles(documents.size())
                .categoryBreakdown(categoryBreakdown)
                .snapshots(snapshotResponses)
                .build();
    }

    @Override
    public StorageCleanupScanResponse runDuplicateCleanup(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<Document> documents = documentRepository.findByUserId(userId);
        
        // Group by checksum
        Map<String, List<Document>> groupedByChecksum = documents.stream()
                .filter(d -> d.getChecksum() != null && !d.getChecksum().isEmpty())
                .collect(Collectors.groupingBy(Document::getChecksum));

        List<Document> duplicatesToDelete = new ArrayList<>();
        int duplicatesCount = 0;
        long totalReclaimedBytes = 0;

        for (Map.Entry<String, List<Document>> entry : groupedByChecksum.entrySet()) {
            List<Document> group = entry.getValue();
            if (group.size() > 1) {
                // Sort by createdAt ascending (keep the earliest version)
                group.sort(Comparator.comparing(Document::getCreatedAt));
                
                // Keep the first (index 0), delete the rest
                for (int i = 1; i < group.size(); i++) {
                    Document duplicate = group.get(i);
                    duplicatesToDelete.add(duplicate);
                    totalReclaimedBytes += duplicate.getFileSize();
                    duplicatesCount++;
                }
            }
        }

        double spaceReclaimedMb = (double) totalReclaimedBytes / (1024.0 * 1024.0);
        spaceReclaimedMb = Math.round(spaceReclaimedMb * 100.0) / 100.0;

        if (!duplicatesToDelete.isEmpty()) {
            documentRepository.deleteAll(duplicatesToDelete);
            
            // Recalculate user storage used
            long remainingBytes = documents.stream()
                    .filter(d -> !duplicatesToDelete.contains(d))
                    .mapToLong(Document::getFileSize)
                    .sum();
            long newUsedMb = Math.max(0L, Math.round((double) remainingBytes / (1024.0 * 1024.0)));
            user.setStorageUsedMb(newUsedMb);
            userRepository.save(user);
        }

        StorageCleanupScan scan = StorageCleanupScan.builder()
                .user(user)
                .scanType(CleanupScanType.DUPLICATE)
                .status("COMPLETED")
                .filesFound(duplicatesCount)
                .spaceReclaimedMb(spaceReclaimedMb)
                .build();
        
        storageCleanupScanRepository.save(scan);

        return StorageCleanupScanResponse.builder()
                .id(scan.getId())
                .scanType(scan.getScanType())
                .status(scan.getStatus())
                .filesFound(scan.getFilesFound())
                .spaceReclaimedMb(scan.getSpaceReclaimedMb())
                .createdAt(scan.getCreatedAt())
                .build();
    }

    @Override
    public StorageCleanupScanResponse runLargeCleanup(Long userId, Long minSizeMb) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<Document> documents = documentRepository.findByUserId(userId);
        long minSizeBytes = minSizeMb * 1024L * 1024L;

        List<Document> largeFilesToDelete = documents.stream()
                .filter(d -> d.getFileSize() >= minSizeBytes)
                .collect(Collectors.toList());

        int filesFound = largeFilesToDelete.size();
        long totalReclaimedBytes = largeFilesToDelete.stream().mapToLong(Document::getFileSize).sum();
        double spaceReclaimedMb = (double) totalReclaimedBytes / (1024.0 * 1024.0);
        spaceReclaimedMb = Math.round(spaceReclaimedMb * 100.0) / 100.0;

        if (!largeFilesToDelete.isEmpty()) {
            documentRepository.deleteAll(largeFilesToDelete);

            // Recalculate user storage used
            long remainingBytes = documents.stream()
                    .filter(d -> !largeFilesToDelete.contains(d))
                    .mapToLong(Document::getFileSize)
                    .sum();
            long newUsedMb = Math.max(0L, Math.round((double) remainingBytes / (1024.0 * 1024.0)));
            user.setStorageUsedMb(newUsedMb);
            userRepository.save(user);
        }

        StorageCleanupScan scan = StorageCleanupScan.builder()
                .user(user)
                .scanType(CleanupScanType.LARGE)
                .status("COMPLETED")
                .filesFound(filesFound)
                .spaceReclaimedMb(spaceReclaimedMb)
                .build();

        storageCleanupScanRepository.save(scan);

        return StorageCleanupScanResponse.builder()
                .id(scan.getId())
                .scanType(scan.getScanType())
                .status(scan.getStatus())
                .filesFound(scan.getFilesFound())
                .spaceReclaimedMb(scan.getSpaceReclaimedMb())
                .createdAt(scan.getCreatedAt())
                .build();
    }

    private String getCategory(String fileType) {
        if (fileType == null) return "Other";
        return switch (fileType.toUpperCase()) {
            case "PDF", "TXT", "DOCUMENT", "DOC", "DOCX" -> "Document";
            case "IMAGE", "VIDEO", "MEDIA", "PNG", "JPG", "MP4" -> "Media";
            case "AUDIO", "MP3", "WAV" -> "Audio";
            default -> "Other";
        };
    }
}
