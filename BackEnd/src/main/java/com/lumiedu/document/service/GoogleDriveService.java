package com.lumiedu.document.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface GoogleDriveService {
    default String uploadFile(MultipartFile file, String folderName) throws IOException {
        return uploadFile(file, folderName, null);
    }

    default String uploadFile(MultipartFile file, java.util.List<String> folderHierarchy) throws IOException {
        return uploadFile(file, folderHierarchy, null);
    }

    default Resource downloadFile(String googleDriveFileId) throws IOException {
        return downloadFile(googleDriveFileId, null);
    }

    default void deleteFile(String googleDriveFileId) throws IOException {
        deleteFile(googleDriveFileId, null);
    }

    String uploadFile(MultipartFile file, String folderName, Long userId) throws IOException;
    String uploadFile(MultipartFile file, java.util.List<String> folderHierarchy, Long userId) throws IOException;
    Resource downloadFile(String googleDriveFileId, Long userId) throws IOException;
    void deleteFile(String googleDriveFileId, Long userId) throws IOException;

    default void shareFile(String googleDriveFileId, String email, String role) throws IOException {
        shareFile(googleDriveFileId, email, role, null);
    }

    default void revokeShare(String googleDriveFileId, String email) throws IOException {
        revokeShare(googleDriveFileId, email, null);
    }

    void shareFile(String googleDriveFileId, String email, String role, Long userId) throws IOException;
    void revokeShare(String googleDriveFileId, String email, Long userId) throws IOException;
    boolean isUserDriveConnected(Long userId);
}
