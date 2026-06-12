package com.lumiedu.document.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface GoogleDriveService {
    /**
     * Upload file lên Google Drive
     * @return googleDriveFileId
     */
    String uploadFile(MultipartFile file, String folderName) throws IOException;

    /**
     * Upload file lên Google Drive theo cấu trúc phân cấp thư mục (Ngành học -> Kỳ học -> Môn học)
     * @return googleDriveFileId
     */
    String uploadFile(MultipartFile file, java.util.List<String> folderHierarchy) throws IOException;

    /**
     * Tải file từ Google Drive
     */
    Resource downloadFile(String googleDriveFileId) throws IOException;

    /**
     * Xóa file khỏi Google Drive
     */
    void deleteFile(String googleDriveFileId) throws IOException;
}
