package com.lumiedu.document.service.impl;

import com.lumiedu.document.service.GoogleDriveService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class GoogleDriveServiceImpl implements GoogleDriveService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        if (originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf('.'));
        }
        
        // Tạo mã file Google Drive giả lập
        String googleDriveFileId = "gdrive_" + UUID.randomUUID().toString().replace("-", "");
        String savedFileName = googleDriveFileId + extension;

        // Lưu trữ vật lý vào thư mục mock local để phục vụ trích xuất text
        Path targetPath = Paths.get(uploadDir, "google_drive_mock", savedFileName).toAbsolutePath().normalize();
        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        System.out.println("MOCK GOOGLE DRIVE: Đã upload thành công file lên Google Drive (Giả lập). File ID: " + googleDriveFileId);
        return googleDriveFileId;
    }

    @Override
    public Resource downloadFile(String googleDriveFileId) throws IOException {
        // Tìm file giả lập trong thư mục mock để tải xuống
        Path dirPath = Paths.get(uploadDir, "google_drive_mock").toAbsolutePath().normalize();
        // Tìm file bắt đầu bằng googleDriveFileId
        try (var files = Files.list(dirPath)) {
            Path matchedFile = files.filter(p -> p.getFileName().toString().startsWith(googleDriveFileId))
                    .findFirst()
                    .orElseThrow(() -> new IOException("Không tìm thấy file trên Google Drive Mock: " + googleDriveFileId));
            return new UrlResource(matchedFile.toUri());
        }
    }

    @Override
    public void deleteFile(String googleDriveFileId) throws IOException {
        Path dirPath = Paths.get(uploadDir, "google_drive_mock").toAbsolutePath().normalize();
        try (var files = Files.list(dirPath)) {
            var matchedFile = files.filter(p -> p.getFileName().toString().startsWith(googleDriveFileId)).findFirst();
            if (matchedFile.isPresent()) {
                Files.delete(matchedFile.get());
                System.out.println("MOCK GOOGLE DRIVE: Đã xóa file ID: " + googleDriveFileId);
            }
        }
    }
}
