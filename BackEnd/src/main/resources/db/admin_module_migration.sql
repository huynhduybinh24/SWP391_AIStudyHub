-- SQL Migration script for LumiEdu Admin Module
-- Tương thích với MySQL

-- 1. Create table system_settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO system_settings (setting_key, setting_value)
VALUES
('SYSTEM_MODE', 'NORMAL'),
('SYSTEM_MESSAGE', 'System is running normally.')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 2. Gợi ý thêm cột cho bảng documents để phục vụ moderation (nếu team quyết định bổ sung)
-- ALTER TABLE documents
-- ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
-- ADD COLUMN moderation_reason LONGTEXT NULL;
