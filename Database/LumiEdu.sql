-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: lumiedu
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE IF NOT EXISTS lumiedu;
USE lumiedu;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender` enum('bot','user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên file đính kèm nếu có',
  `reasoning_thought` text COLLATE utf8mb4_unicode_ci COMMENT 'Thought log - ghi lại quá trình suy luận sâu (Thinking Mode) của AI',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_message_session` (`session_id`),
  CONSTRAINT `fk_messages_session` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Cuộc trò chuyện mới',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chats_user` (`user_id`),
  CONSTRAINT `fk_chats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_comments`
--

DROP TABLE IF EXISTS `document_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_comments` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Người bình luận',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nội dung bình luận',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comments_user` (`user_id`),
  KEY `idx_comment_doc` (`document_id`),
  CONSTRAINT `fk_comments_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_comments`
--

LOCK TABLES `document_comments` WRITE;
/*!40000 ALTER TABLE `document_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_shares`
--

DROP TABLE IF EXISTS `document_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_shares` (
  `document_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shared_with_user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Thành viên nhận tài liệu hoặc được chia sẻ',
  `permission` enum('View Only','Viewer','Editor','Owner') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Viewer',
  `date_shared` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`,`shared_with_user_id`),
  KEY `idx_share_receiver` (`shared_with_user_id`),
  CONSTRAINT `fk_shares_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shares_user` FOREIGN KEY (`shared_with_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_shares`
--

LOCK TABLES `document_shares` WRITE;
/*!40000 ALTER TABLE `document_shares` DISABLE KEYS */;
INSERT INTO `document_shares` VALUES ('doc-001','u-002','Viewer','2026-05-25 20:27:18');
/*!40000 ALTER TABLE `document_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID của chủ sở hữu tài liệu',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên tệp gốc',
  `course` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Môn học/Khóa học tương ứng (VD: Biology, Physics...)',
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kiểu tài liệu (pdf, docx, xlsx, txt, image, video)',
  `size_bytes` bigint NOT NULL COMMENT 'Dung lượng tệp tin tính bằng bytes',
  `url` varchar(505) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Đường dẫn liên kết tải tệp (S3, Cloudinary hoặc lưu trữ cục bộ)',
  `preview_content` text COLLATE utf8mb4_unicode_ci COMMENT 'Một phần nội dung văn bản trích xuất để hiển thị nhanh',
  `summary` text COLLATE utf8mb4_unicode_ci COMMENT 'Bản tóm tắt nội dung được tạo bởi AI',
  `total_pages` int DEFAULT NULL COMMENT 'Tổng số trang nếu là tài liệu văn bản',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_user` (`user_id`),
  CONSTRAINT `fk_documents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES ('doc-001','u-001','Lecture_Notes_Quantum_Mechanics.pdf','Physics','pdf',4500000,'https://storage.aistudyhub.com/u-001/Quantum_Mechanics.pdf','Schrödinger wave equation and wave-particle duality concepts.','Bản tóm tắt: Tài liệu giới thiệu nền tảng cơ học lượng tử, bao gồm hàm sóng, phương trình Schrödinger và nguyên lý bất định Heisenberg.',12,'2026-05-25 20:27:18','2026-05-25 20:27:18'),('doc-002','u-001','Organic_Chemistry_Synthesis.docx','Chemistry','docx',1200000,'https://storage.aistudyhub.com/u-001/Organic_Chem.docx','Introduction to carbon compounds and metabolic pathways.','Tóm tắt: Phân tích sâu về phản ứng thế SN1/SN2 và phản ứng tách E1/E2 trong hóa hữu cơ nâng cao.',8,'2026-05-25 20:27:18','2026-05-25 20:27:18');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `variant` enum('info','success','warning','neutral') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('notif-001','u-001','Upgrade Successful!','Chúc mừng bạn đã nâng cấp tài khoản lên gói PRO! 100GB lưu trữ đám mây của bạn đã sẵn sàng.','success',0,'2026-05-25 20:27:18'),('notif-002','u-001','New Document Shared','Giảng viên đã chia sẻ tài liệu \"Advanced Robotics Slide\" vào Workspace của bạn.','info',0,'2026-05-25 20:27:18');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partnership_requests`
--

DROP TABLE IF EXISTS `partnership_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partnership_requests` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partnership_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'VD: Educational, Content Creator, AI Integration...',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','Approved','Rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partnership_requests`
--

LOCK TABLES `partnership_requests` WRITE;
/*!40000 ALTER TABLE `partnership_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `partnership_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_attempts`
--

DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quiz_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct_count` int NOT NULL COMMENT 'Số câu trả lời đúng',
  `total_count` int NOT NULL COMMENT 'Tổng số câu trong bài',
  `score_percentage` decimal(5,2) NOT NULL COMMENT 'Điểm số phần trăm (0 - 100.00)',
  `attempted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attempt_user` (`user_id`),
  KEY `idx_attempt_quiz` (`quiz_id`),
  CONSTRAINT `fk_attempts_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_attempts`
--

LOCK TABLES `quiz_attempts` WRITE;
/*!40000 ALTER TABLE `quiz_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `quiz_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_options`
--

DROP TABLE IF EXISTS `quiz_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `option_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Đây có phải là đáp án chính xác không',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_option_question` (`question_id`),
  CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_options`
--

LOCK TABLES `quiz_options` WRITE;
/*!40000 ALTER TABLE `quiz_options` DISABLE KEYS */;
INSERT INTO `quiz_options` VALUES (1,1,'Inside the mitochondrial matrix',0,1),(2,1,'In the nucleus',0,2),(3,1,'Within the rough endoplasmic reticulum',0,3),(4,1,'In the cytoplasm',1,4),(5,2,'V = I / R',0,1),(6,2,'I = V * R',0,2),(7,2,'V = I * R',1,3),(8,2,'R = V * I',0,4);
/*!40000 ALTER TABLE `quiz_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_questions`
--

DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci COMMENT 'Giải thích chi tiết đáp án đúng do AI sinh ra',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_question_quiz` (`quiz_id`),
  CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_questions`
--

LOCK TABLES `quiz_questions` WRITE;
/*!40000 ALTER TABLE `quiz_questions` DISABLE KEYS */;
INSERT INTO `quiz_questions` VALUES (1,'quiz-001','Where in the eukaryotic cell does Glycolysis take place?','Glycolysis is the anaerobic breakdown of glucose that occurs in the cytosol/cytoplasm of the cell.',1),(2,'quiz-001','What does Ohm\'s Law state regarding current, voltage, and resistance?','Ohm\'s Law defines the relationship: Voltage (V) equals Current (I) multiplied by Resistance (R).',2);
/*!40000 ALTER TABLE `quiz_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tạo dựa trên tài liệu nào',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên bài trắc nghiệm',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_doc` (`document_id`),
  CONSTRAINT `fk_quizzes_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES ('quiz-001','doc-001','Quantum Mechanics Wave-Particle Quiz','2026-05-25 20:27:18');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_plan_lessons`
--

DROP TABLE IF EXISTS `study_plan_lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_plan_lessons` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thời lượng ước tính hiển thị (VD: "20 min", "1 hour")',
  `type` enum('video','reading','quiz','practice') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reading',
  `status` enum('completed','in-progress','locked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'locked',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_lessons_module` (`module_id`),
  CONSTRAINT `fk_lessons_module` FOREIGN KEY (`module_id`) REFERENCES `study_plan_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_plan_lessons`
--

LOCK TABLES `study_plan_lessons` WRITE;
/*!40000 ALTER TABLE `study_plan_lessons` DISABLE KEYS */;
INSERT INTO `study_plan_lessons` VALUES ('les-001','mod-001','Introduction to Quantum Theory','20 min','video','completed',1),('les-002','mod-001','Wave-Particle Duality','25 min','reading','completed',2),('les-003','mod-001','Quantum States & Superposition','30 min','quiz','completed',3),('les-004','mod-002','Schrödinger\'s Equation','40 min','video','completed',1),('les-005','mod-002','Quantum Entanglement','35 min','reading','in-progress',2),('les-006','mod-002','Heisenberg Uncertainty Principle','30 min','practice','locked',3);
/*!40000 ALTER TABLE `study_plan_lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_plan_milestones`
--

DROP TABLE IF EXISTS `study_plan_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_plan_milestones` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `study_plan_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `milestone_date` date NOT NULL COMMENT 'Ngày của mốc thi cử/nhiệm vụ lớn',
  `time_str` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Giờ hiển thị kèm theo (VD: "10:00 AM Tomorrow")',
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestones_plan` (`study_plan_id`),
  CONSTRAINT `fk_milestones_plan` FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_plan_milestones`
--

LOCK TABLES `study_plan_milestones` WRITE;
/*!40000 ALTER TABLE `study_plan_milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `study_plan_milestones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_plan_modules`
--

DROP TABLE IF EXISTS `study_plan_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_plan_modules` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `study_plan_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên chặng/chương học (VD: Core Concepts, Advanced Theory)',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progress_percentage` int NOT NULL DEFAULT '0' COMMENT 'Tiến trình hoàn thành chặng (0-100%)',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_modules_plan` (`study_plan_id`),
  CONSTRAINT `fk_modules_plan` FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_plan_modules`
--

LOCK TABLES `study_plan_modules` WRITE;
/*!40000 ALTER TABLE `study_plan_modules` DISABLE KEYS */;
INSERT INTO `study_plan_modules` VALUES ('mod-001','plan-001','Core Concepts','Foundations of quantum theory',100,1),('mod-002','plan-001','Advanced Theory','Deep dive into quantum equations',65,2),('mod-003','plan-001','Mock Exam Prep','Exam simulations and review',0,3);
/*!40000 ALTER TABLE `study_plan_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_plans`
--

DROP TABLE IF EXISTS `study_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_plans` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_ai_generated` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('Active','Completed','Upcoming') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Upcoming',
  `difficulty` enum('Easy','Medium','Hard') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `overall_progress` int NOT NULL DEFAULT '0' COMMENT 'Phần trăm tiến trình tổng quát (0-100%)',
  `theme_color` enum('blue','purple','teal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blue',
  `icon_type` enum('flask','rocket','bot','cpu','languages') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'flask',
  `starts_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plans_user` (`user_id`),
  CONSTRAINT `fk_plans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_plans`
--

LOCK TABLES `study_plans` WRITE;
/*!40000 ALTER TABLE `study_plans` DISABLE KEYS */;
INSERT INTO `study_plans` VALUES ('plan-001','u-001','Quantum Mechanics Mastery','A comprehensive journey from wave functions to quantum entanglement.',1,'Active','Hard',65,'blue','flask','2026-05-25 20:27:18',NULL,'2026-05-25 20:27:18','2026-05-25 20:27:18'),('plan-002','u-001','Organic Chemistry Deep Dive','Exploring carbon compounds and metabolic pathways.',1,'Active','Medium',20,'purple','flask','2026-05-25 20:27:18',NULL,'2026-05-25 20:27:18','2026-05-25 20:27:18');
/*!40000 ALTER TABLE `study_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_sessions`
--

DROP TABLE IF EXISTS `study_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `study_date` date NOT NULL COMMENT 'Ngày ghi nhận thời gian học',
  `seconds_tracked` int NOT NULL DEFAULT '0' COMMENT 'Số giây hoạt động tích lũy trong ngày',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_date` (`user_id`,`study_date`),
  KEY `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_sessions`
--

LOCK TABLES `study_sessions` WRITE;
/*!40000 ALTER TABLE `study_sessions` DISABLE KEYS */;
INSERT INTO `study_sessions` VALUES (1,'u-001','2026-05-26',7200),(2,'u-001','2026-05-25',5400),(3,'u-001','2026-05-24',10800);
/*!40000 ALTER TABLE `study_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `upgrade_transactions`
--

DROP TABLE IF EXISTS `upgrade_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upgrade_transactions` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_plan` enum('pro','institutional') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL COMMENT 'Số tiền thanh toán',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'VND' COMMENT 'Thường dùng VND cho VNPAY',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Phương thức thanh toán (VNPay, VietQR, PayPal...)',
  `status` enum('pending','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `vnp_txn_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã tham chiếu giao dịch gửi sang VNPay (thường khớp với id)',
  `vnp_transaction_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Số giao dịch ghi nhận trên hệ thống VNPay',
  `vnp_bank_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã ngân hàng thanh toán (VD: VNPAYQR, NCB, MB...)',
  `vnp_response_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã phản hồi từ VNPay (00 là thành công)',
  `vnp_pay_date` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thời gian ghi nhận giao dịch từ VNPay',
  `payment_gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vnpay' COMMENT 'Hệ thống thanh toán: vnpay, paypal, vietqr...',
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trans_user` (`user_id`),
  KEY `idx_vnp_txn_ref` (`vnp_txn_ref`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `upgrade_transactions`
--

LOCK TABLES `upgrade_transactions` WRITE;
/*!40000 ALTER TABLE `upgrade_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `upgrade_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mật khẩu đã được mã hóa (bcrypt/argon2)',
  `role` enum('student','instructor','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `plan` enum('free','pro','institutional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free',
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storage_total_gb` decimal(6,2) NOT NULL DEFAULT '5.00' COMMENT 'Dung lượng cấp phát mặc định: Free: 5GB, Pro: 100GB, Institutional: 500GB',
  `storage_used_gb` decimal(6,4) NOT NULL DEFAULT '0.0000' COMMENT 'Dung lượng đã sử dụng thực tế tính theo GB',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('u-001','Duy Binh','duybinh@student.edu.vn','$2a$12$R9h/lIPzMRFEXS9GqgK9Je9hRUXaVp4Uq4Q53W1wD5k.y1Gge7J8e','student','pro','https://api.dicebear.com/7.x/adventurer/svg?seed=DuyBinh',100.00,12.4500,'2026-05-25 20:27:18','2026-05-25 20:27:18'),('u-002','Lumi Helper','assistant@aistudyhub.com','$2a$12$R9h/lIPzMRFEXS9GqgK9Je9hRUXaVp4Uq4Q53W1wD5k.y1Gge7J8e','admin','institutional','https://api.dicebear.com/7.x/bottts/svg?seed=Lumi',500.00,0.0500,'2026-05-25 20:27:18','2026-05-25 20:27:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-26  3:32:00
