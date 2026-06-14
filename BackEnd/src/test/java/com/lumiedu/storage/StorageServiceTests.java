package com.lumiedu.storage;

import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.storage.dto.response.StorageCleanupScanResponse;
import com.lumiedu.storage.dto.response.StorageUsageResponse;
import com.lumiedu.storage.entity.StorageCleanupScan;
import com.lumiedu.storage.enums.CleanupScanType;
import com.lumiedu.storage.repository.StorageCleanupScanRepository;
import com.lumiedu.storage.repository.StorageRepository;
import com.lumiedu.storage.service.impl.StorageServiceImpl;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class StorageServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private StorageRepository storageRepository;

    @Mock
    private StorageCleanupScanRepository storageCleanupScanRepository;

    @Mock
    private com.lumiedu.billing.repository.UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private com.lumiedu.billing.repository.SubscriptionPlanRepository subscriptionPlanRepository;

    @InjectMocks
    private StorageServiceImpl storageService;

    private User testUser;
    private List<Document> testDocuments;

    @BeforeEach
    void setUp() {
        lenient().when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByEndDateDesc(anyLong(), any()))
                .thenReturn(Optional.empty());
        lenient().when(subscriptionPlanRepository.findByPlanType(any()))
                .thenReturn(Optional.empty());

        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@lumiedu.com")
                .storageUsedMb(20L)
                .storageLimitMb(100L)
                .build();

        testDocuments = new ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        
        // 5MB PDF
        testDocuments.add(Document.builder()
                .id(10L)
                .title("Doc1.pdf")
                .fileSize(5 * 1024 * 1024L)
                .fileType("PDF")
                .checksum("checksum-a")
                .userId(testUser.getId())
                .createdAt(now)
                .build());

        // Duplicate of Doc1
        testDocuments.add(Document.builder()
                .id(11L)
                .title("Doc1_Copy.pdf")
                .fileSize(5 * 1024 * 1024L)
                .fileType("PDF")
                .checksum("checksum-a") // duplicate!
                .userId(testUser.getId())
                .createdAt(now.plusSeconds(10))
                .build());

        // 12MB video (Large file!)
        testDocuments.add(Document.builder()
                .id(12L)
                .title("Video.mp4")
                .fileSize(12 * 1024 * 1024L)
                .fileType("VIDEO")
                .checksum("checksum-b")
                .userId(testUser.getId())
                .createdAt(now)
                .build());
    }

    @Test
    void testGetStorageUsage() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        StorageUsageResponse response = storageService.getStorageUsage(1L);

        assertNotNull(response);
        assertEquals(20.0, response.getStorageUsedMb());
        assertEquals(100.0, response.getStorageLimitMb());
        assertEquals(20.0, response.getStoragePercentage());
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void testRunDuplicateCleanup() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(documentRepository.findByUserId(1L)).thenReturn(testDocuments);
        when(storageCleanupScanRepository.save(any(StorageCleanupScan.class))).thenAnswer(i -> i.getArgument(0));

        StorageCleanupScanResponse response = storageService.runDuplicateCleanup(1L);

        assertNotNull(response);
        assertEquals(CleanupScanType.DUPLICATE, response.getScanType());
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(1, response.getFilesFound()); // 1 duplicate deleted
        assertEquals(5.0, response.getSpaceReclaimedMb()); // 5MB reclaimed
        
        verify(documentRepository, times(1)).deleteAll(anyList());
        verify(userRepository, times(1)).save(testUser);
        verify(storageCleanupScanRepository, times(1)).save(any(StorageCleanupScan.class));
    }

    @Test
    void testRunLargeCleanup() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(documentRepository.findByUserId(1L)).thenReturn(testDocuments);
        when(storageCleanupScanRepository.save(any(StorageCleanupScan.class))).thenAnswer(i -> i.getArgument(0));

        // Threshold = 10MB (Video.mp4 is 12MB, so it should be deleted)
        StorageCleanupScanResponse response = storageService.runLargeCleanup(1L, 10L);

        assertNotNull(response);
        assertEquals(CleanupScanType.LARGE, response.getScanType());
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(1, response.getFilesFound()); // 1 file >= 10MB
        assertEquals(12.0, response.getSpaceReclaimedMb()); // 12MB reclaimed

        verify(documentRepository, times(1)).deleteAll(anyList());
        verify(userRepository, times(1)).save(testUser);
        verify(storageCleanupScanRepository, times(1)).save(any(StorageCleanupScan.class));
    }
}
