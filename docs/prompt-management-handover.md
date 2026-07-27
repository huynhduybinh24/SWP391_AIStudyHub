# Prompt Management System Handover

## 1. Overview

Hệ thống **Quản lý AI Prompt (Prompt Management System)** cho nền tảng LumiEdu được thiết kế và triển khai nhằm chuyển đổi toàn bộ các câu lệnh điều khiển AI (System Prompts) từ việc lưu cứng (hard-coded) trong mã nguồn Java sang cơ chế lưu trữ linh hoạt trong Database, hỗ trợ **Semantic Versioning**, **Draft → Review → Publish Workflow**, **Unified Diff Comparison**, **Rollback**, và **AI Execution Logging**.

## 2. Final Architecture

Giao diện Admin Web và Runtime Prompt Engine tương tác theo sơ đồ kiến trúc chuẩn:

```text
Admin Web (React + TS + Vite)
    ↓ (REST API /api/admin/prompts)
Markdown Editor (Edit / Preview / Split View / Inspector)
    ↓
Database (prompts & prompt_versions tables)
    ↓
Prompt Version History (v1.0.0, v1.1.0, v2.0.0...)
    ↓
Workflow State Machine (Draft → In Review → Approved → Published / Archived)
    ↓
Prompt Engine Service (PromptEngineService.executePrompt)
    ↓
Gemini AI Client (Gemini API Integration)
    ↓
AI Execution Logging (ai_execution_logs table: Prompt Version, Knowledge Version, LLM Model, Latency, Token Usage)
```

## 3. Database Tables

System Schema bao gồm 4 bảng chính:

1. **`prompts`**: Lưu thông tin danh mục Prompt.
   - `id` (BIGINT PK)
   - `code` (VARCHAR(100) UNIQUE NOT NULL)
   - `name` (VARCHAR(255) NOT NULL)
   - `description` (TEXT)
   - `category` (VARCHAR(50) NOT NULL: `GENERATION`, `ASSESSMENT`, `CONVERSATION`, `MODERATION`, `SYSTEM`)
   - `active` (BOOLEAN DEFAULT TRUE)
   - `created_by`, `updated_by` (FK -> `users`)

2. **`prompt_versions`**: Lưu vết từng phiên bản Markdown template.
   - `id` (BIGINT PK)
   - `prompt_id` (BIGINT FK -> `prompts`)
   - `version` (VARCHAR(20) NOT NULL, ví dụ: `v1.0.0`)
   - `markdown_content` (LONGTEXT NOT NULL)
   - `status` (VARCHAR(20) NOT NULL: `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PUBLISHED`, `ARCHIVED`)
   - `change_type` (VARCHAR(10) NOT NULL: `PATCH`, `MINOR`, `MAJOR`)
   - `change_summary` (VARCHAR(500) NOT NULL)
   - `change_reason` (TEXT NOT NULL)
   - `previous_version_id` (FK -> `prompt_versions`)
   - `rollback_source_version_id` (FK -> `prompt_versions`)
   - `created_by`, `updated_by`, `reviewed_by`, `published_by` (FK -> `users`)
   - `reviewed_at`, `published_at` (TIMESTAMP)
   - *Ràng buộc Unique*: `UNIQUE(prompt_id, version)`
   - *Index*: `INDEX(prompt_id, status)`

3. **`prompt_review_history`**: Nhật ký kiểm toán lịch sử phê duyệt.
   - `id` (BIGINT PK)
   - `prompt_version_id` (BIGINT FK -> `prompt_versions`)
   - `action` (VARCHAR(50) NOT NULL: `SUBMITTED_FOR_REVIEW`, `APPROVED`, `REJECTED`, `PUBLISHED`, `ROLLBACK`)
   - `comment` (TEXT)
   - `performed_by` (FK -> `users`)
   - `performed_at` (TIMESTAMP NOT NULL)

4. **`ai_execution_logs`**: Nhật ký thực thi kiểm toán AI Production.
   - `id` (BIGINT PK)
   - `user_id` (BIGINT FK -> `users`)
   - `student_code` (VARCHAR(100))
   - `feature_type` (VARCHAR(100) NOT NULL)
   - `prompt_id` (BIGINT FK -> `prompts`)
   - `prompt_code` (VARCHAR(100) NOT NULL)
   - `prompt_version_id` (BIGINT FK -> `prompt_versions`)
   - `prompt_version` (VARCHAR(50) NOT NULL)
   - `knowledge_base_id` (VARCHAR(100))
   - `knowledge_version` (VARCHAR(50))
   - `llm_provider` (VARCHAR(50))
   - `llm_model` (VARCHAR(100))
   - `request_id` (VARCHAR(100))
   - `status` (VARCHAR(20) NOT NULL: `PROCESSING`, `SUCCESS`, `FAILED`)
   - `error_message` (TEXT)
   - `latency_ms` (BIGINT)
   - `token_usage` (INT)
   - `input_metadata` (LONGTEXT)
   - `started_at`, `completed_at` (TIMESTAMP)

## 4. Prompt Version Lifecycle

Vòng đời của một Version tuân theo quy tắc Semantic Versioning:
- **`PATCH`** (`v1.0.0` → `v1.0.1`): Chỉnh sửa câu từ nhỏ, sửa lỗi chính tả.
- **`MINOR`** (`v1.0.0` → `v1.1.0`): Thêm biến `{{placeholder}}` mới hoặc bổ sung tiêu chí phụ.
- **`MAJOR`** (`v1.0.0` → `v2.0.0`): Viết lại toàn bộ cấu trúc Prompt hoặc thay đổi định dạng JSON đầu ra.

## 5. Draft → Review → Publish Workflow

Mọi phiên bản Prompt bắt buộc trải qua các bước trong State Machine:
1. **`DRAFT`**: Đang soạn thảo nội dung Markdown. Chỉ người tạo mới được sửa.
2. **`IN_REVIEW`**: Khóa nội dung, gửi cho Reviewer/Admin đánh giá.
3. **`REJECTED`**: Nếu không đạt, chuyển về `REJECTED` kèm nhận xét cụ thể.
4. **`APPROVED`**: Được phê duyệt, sẵn sàng đưa lên Production.
5. **`PUBLISHED`**: Chính thức chạy trên Production cho các cuộc gọi AI. Phiên bản `PUBLISHED` cũ tự động chuyển thành **`ARCHIVED`**.

## 6. Prompt Engine Runtime Flow

Khi ứng dụng thực thi một chức năng AI (như Tóm tắt tài liệu):
1. Service gọi `PromptEngineService.executePrompt(promptCode, variablesMap)`.
2. `PromptEngineService` truy vấn phiên bản `PUBLISHED` hiện tại từ DB theo `promptCode`.
3. Kiểm tra tính hợp lệ và giải mã đầy đủ các biến dạng `{{variable}}`.
4. Gọi Gemini Client để tạo nội dung từ LLM.
5. Tự động ghi lại `ai_execution_logs` gắn chính xác ID và số hiệu của Prompt Version đã được giải mã trong suốt request.

## 7. AI Execution Logging

Ghi nhận thông tin kiểm toán mỗi khi AI được gọi:
- Lưu vết chính xác `promptVersionId` và `promptVersion` tại thời điểm khởi tạo request.
- Nếu Admin Publish phiên bản mới trong lúc request đang chạy, log của request đó vẫn giữ nguyên số phiên bản gốc đã dùng.

## 8. Knowledge Version Handling

- Môi trường hiện tại hỗ trợ Knowledge Context Resolver từ hệ thống Document Chunking / Vector Store.
- Trường `knowledgeVersion` ghi nhận mã phiên bản của tập tri thức hoặc hiển thị `UNVERSIONED` nếu tập dữ liệu chưa phân phiên bản.

## 9. Admin Web Routes

Các đường dẫn giao diện Admin trong React Web Application:
- `/dashboard/admin/prompts`: Danh sách Prompt, bộ lọc & tìm kiếm.
- `/dashboard/admin/prompts/new`: Trang khởi tạo Prompt mới & v1.0.0 Draft.
- `/dashboard/admin/prompts/:promptId`: Trang chi tiết Prompt & phiên bản Published hiện tại.
- `/dashboard/admin/prompts/:promptId/versions/new`: Tạo phiên bản mới.
- `/dashboard/admin/prompts/:promptId/versions/:versionId`: Xem/sửa phiên bản, Submit/Approve/Reject/Publish/Rollback.
- `/dashboard/admin/prompts/:promptId/history`: Lịch sử đầy đủ các phiên bản.
- `/dashboard/admin/prompts/:promptId/diff`: So sánh Diff giữa 2 phiên bản.
- `/dashboard/admin/ai-execution-logs`: Nhật ký kiểm toán AI Execution.

## 10. Backend API Endpoints

- `GET /api/admin/prompts`: Lấy danh sách Prompts.
- `GET /api/admin/prompts/{id}`: Lấy chi tiết Prompt.
- `POST /api/admin/prompts`: Tạo Prompt mới.
- `PUT /api/admin/prompts/{id}`: Cập nhật thông tin Prompt.
- `PATCH /api/admin/prompts/{id}/status`: Bật/Tắt trạng thái Active.
- `GET /api/admin/prompts/{id}/versions`: Lấy danh sách các Version.
- `GET /api/admin/prompts/{id}/versions/{versionId}`: Xem chi tiết 1 Version.
- `POST /api/admin/prompts/{id}/versions`: Tạo Version mới (Draft).
- `PUT /api/admin/prompts/{id}/versions/{versionId}`: Cập nhật nội dung Draft.
- `POST /api/admin/prompts/{id}/versions/{versionId}/submit-review`: Gửi duyệt.
- `POST /api/admin/prompts/{id}/versions/{versionId}/approve`: Phê duyệt.
- `POST /api/admin/prompts/{id}/versions/{versionId}/reject`: Từ chối kèm comment.
- `POST /api/admin/prompts/{id}/versions/{versionId}/publish`: Xuất bản lên Production.
- `POST /api/admin/prompts/{id}/rollback`: Tạo bản Rollback Draft.
- `GET /api/admin/prompts/{id}/diff`: So sánh Diff 2 Version.
- `GET /api/admin/ai-execution-logs`: Danh sách Execution Logs (có phân trang & bộ lọc).

## 11. Roles and Permissions

- **`ADMIN`**: Toàn quyền truy cập tất cả các trang Admin Prompt, phê duyệt, xuất bản và xem log.
- **`USER` / `STUDENT`**: Bị chặn hoàn toàn truy cập API `/api/admin/**` (Trả `403 Forbidden`) và các đường dẫn UI `/dashboard/admin/**`.

## 12. Initial Prompt Migration

11 System Prompts chính của LumiEdu đã được chuyển đổi thành công từ mớ mã nguồn cũ sang dữ liệu Markdown trong Database:
1. `DOCUMENT_SUMMARY`
2. `CHAT_QA`
3. `QUIZ_GENERATION`
4. `FLASHCARD_GENERATION`
5. `MINDMAP_GENERATION`
6. `SLIDE_GENERATION`
7. `STUDY_PLAN`
8. `FAQ_GENERATION`
9. `DOCUMENT_MODERATION`
10. `ASSIGNMENT_EVALUATION`
11. `CODING_EVALUATION`

## 13. Prompt Initializer Behavior

`PromptSeedServiceImpl` bảo đảm **Idempotency**:
- Không tạo dữ liệu trùng khi restart ứng dụng.
- Sử dụng Pessimistic Lock (`findByCodeForUpdate`) an toàn trong môi trường đa tiến trình.
- Không bao giờ ghi đè hoặc reset nội dung Prompt đã được Admin chỉnh sửa hoặc Publish.

## 14. How to Create a New Prompt

1. Truy cập `/dashboard/admin/prompts`.
2. Nhấn **Create New Prompt**.
3. Nhập mã Prompt (`UPPER_SNAKE_CASE`), tên hiển thị, danh mục và nội dung Markdown khởi tạo.
4. Nhấn **Create Prompt & Initial Version**.

## 15. How to Create a New Version

1. Vào trang chi tiết Prompt.
2. Nhấn **Create New Version**.
3. Chọn nguồn base content (từ bản Published hoặc bản lịch sử).
4. Chọn loại thay đổi (`PATCH`, `MINOR`, `MAJOR`) và nhập lý do thay đổi.
5. Nhấn **Save as DRAFT Version**.

## 16. How to Review and Publish

1. Mở Version dạng `DRAFT`, nhấn **Submit for Review**.
2. Với tư cách Reviewer, kiểm tra nội dung và nhấn **Approve** (hoặc **Reject** kèm comment).
3. Sau khi `APPROVED`, Publisher nhấn **Publish to Production** để đưa vào sử dụng thực tế.

## 17. How to View Diff

1. Mở một phiên bản bất kỳ hoặc truy cập menu **Compare with Previous**.
2. Chọn phiên bản nguồn (From Version) và phiên bản đính kèm (To Version).
3. Giao diện hiển thị chi tiết các dòng được thêm (`+`) và bị xóa (`-`).

## 18. How to Rollback

1. Trong danh sách Version History, chọn phiên bản lịch sử muốn khôi phục.
2. Nhấn **Create Rollback Draft**.
3. Nhập lý do Rollback và chọn loại thay đổi.
4. Hệ thống sẽ tạo một **DRAFT Version mới** sao chép nội dung từ phiên bản nguồn để duyệt lại theo đúng quy trình.

## 19. How to Trace an Incorrect AI Response (Hướng Dẫn Truy Vết AI Trả Lời Sai)

Khi sinh viên phản ánh một câu trả lời AI chưa chính xác:

### Trích xuất thông tin Log:
```text
Student Code: 12345
Feature: ASSIGNMENT_EVALUATION
Prompt Code: ASSIGNMENT_EVALUATION
Prompt Version: v2.1.5
Knowledge Version: v6
LLM Model: Gemini 1.5 Flash
Status: SUCCESS
```

### Các bước Admin thực hiện:
1. Mở trang **AI Execution Logs** (`/dashboard/admin/ai-execution-logs`).
2. Nhập Student Code `12345` hoặc lọc theo Prompt Code `ASSIGNMENT_EVALUATION`.
3. Nhấn **Inspect** tại dòng log tương ứng để xem Request ID và Metadata đầu vào.
4. Nhấn vào liên kết **View Exact Prompt Version** để mở trang chi tiết phiên bản `v2.1.5` đã được dùng tại thời điểm đó (ngay cả khi phiên bản đó hiện tại đã bị `ARCHIVED`).
5. Sử dụng tính năng **Compare** để xem điểm khác biệt giữa `v2.1.5` với các phiên bản trước.
6. Kiểm tra Change Reason và lịch sử người phê duyệt.
7. Nếu phát hiện câu từ Prompt gây hiểu nhầm cho AI, tiến hành tạo **Rollback Draft** hoặc tạo phiên bản sửa lỗi `PATCH` mới.

## 20. Build and Run Commands

### Backend:
```bash
# Clean, test và đóng gói JAR
mvn clean test
mvn clean package
```

### Frontend:
```bash
# Kiểm tra linting và build bundle production
npm run lint
npm run build
```

## 21. Test Commands

```bash
# Chạy toàn bộ 30 unit & integration tests trong Backend
mvn test
```

## 22. Environment Requirements

- Java 21+ / JDK 26 compatible.
- Node.js 18+ & npm.
- MySQL / H2 Database.

## 23. Known Limitations

- Môi trường local test sử dụng mock Gemini Client để tránh tốn cước API và đảm bảo tốc độ chạy unit test.

## 24. Remaining Manual Steps

- Tiến hành kiểm thử thủ công trực tiếp trên môi trường Staging/Production với tài khoản Admin thật sau khi merge code.
