# Kế hoạch Tích hợp: Lập Kế hoạch Học tập & Quản lý Tài liệu

Tài liệu này phác thảo kế hoạch tích hợp tính năng **Lập Kế hoạch Học tập (Study Plan)** xoay quanh trục nghiệp vụ cốt lõi là **Quản lý Tài liệu (Document Management)** dựa trên góp ý của Giảng viên.

---

## 💡 Ý tưởng Tích hợp Cốt lõi
Thay vì coi "Kế hoạch Học tập" là một thực thể độc lập tự nhập tay, hệ thống sẽ chuyển hướng sang **"Bản đồ lộ trình học tập dựa trên tài liệu cá nhân"**:

| Giải pháp hiện tại (Rời rạc) | Giải pháp tích hợp mới (Tập trung vào Tài liệu) |
| :--- | :--- |
| Người dùng tự tạo kế hoạch học tập chung chung không gắn liền tài nguyên nào. | Người dùng **chọn tài liệu cụ thể** (PDF giáo trình, slide bài giảng) để AI quét nội dung và sinh kế hoạch. |
| Các bài học trong kế hoạch chỉ là văn bản mô tả thuần túy. | Mỗi mốc học tập/nhiệm vụ sẽ **liên kết trực tiếp (Deep Link)** tới tài liệu, mở tài liệu lên đọc ngay lập tức. |
| Tiến độ học tập được đánh dấu tay thủ công. | Tiến độ tự động đồng bộ khi người dùng đọc tài liệu, ghi chú hoặc hoàn thành Quiz từ tài liệu đó. |

---

## 🛠️ 3 Giải pháp Tích hợp Chi tiết

### 1. Sinh Kế hoạch Học tập từ Tài liệu (Generate from Document)
* **Ý tưởng**: Cho phép chọn tài liệu nguồn trong Form tạo kế hoạch học tập hoặc thêm nút **"Generate Study Plan with AI"** trực tiếp tại trang chi tiết tài liệu.
* **Luồng hoạt động**:
  1. Người dùng chọn tài liệu cụ thể trong thư viện.
  2. Bấm nút "Lập kế hoạch học tập cùng AI".
  3. AI (Backend kết hợp với OpenAI/Gemini) đọc tóm tắt/cấu trúc tài liệu, phân chia thành các chương/bài và lập lộ trình học tương ứng (ví dụ: trong 2 tuần hoặc 1 tháng).

### 2. Liên kết tài liệu trực tiếp vào bài học (Document Deep Linking)
* **Ý tưởng**: Trong mỗi mốc học tập (`Milestone` / `Lesson`), đính kèm liên kết trực tiếp tới tài liệu tham khảo.
* **Luồng hoạt động**:
  - Tại giao diện chi tiết lộ trình học tập, hiển thị icon tài liệu đính kèm kèm liên kết mở nhanh:
    > 📖 **Lesson 1: Schrödinger Equation**  
    > *Tài liệu tham khảo:* `Co_Hoc_Luong_Tu_Chuong2.pdf` (Trang 15 - 30)
  - Khi click vào, hệ thống mở trực tiếp trình xem PDF (PDF Viewer) của ứng dụng tại trang được cấu hình sẵn.

### 3. Đồng bộ tiến độ qua bài kiểm tra ôn tập (Document-Based Quiz)
* **Ý tưởng**: Sử dụng tài liệu để kiểm tra mức độ hoàn thành bài học trước khi đánh dấu hoàn thành.
* **Luồng hoạt động**:
  - AI sinh tự động 5-10 câu hỏi trắc nghiệm từ tài liệu của bài học đó.
  - Vượt qua bài Quiz này sẽ tự động đánh dấu bài học đó trong Kế hoạch học tập là **Completed (Đã hoàn thành)**.

---

## 📋 Lộ trình Thực hiện Kỹ thuật

### Bước 1: Cập nhật Database (Database Schema Linkage)
Tạo liên kết nhiều-nhiều hoặc một-nhiều giữa `StudyPlan` và `Document`.
* **Backend JPA Entity**:
  ```java
  @Entity
  public class StudyPlan {
      // ... các trường cũ ...
      
      // Liên kết tới các tài liệu được dùng để lập kế hoạch này
      @ManyToMany
      @JoinTable(
          name = "study_plan_documents",
          joinColumns = @JoinColumn(name = "study_plan_id"),
          inverseJoinColumns = @JoinColumn(name = "document_id")
      )
      private Set<Document> sourceDocuments;
  }
  ```

### Bước 2: Cập nhật Form Tạo Kế hoạch (Frontend UI)
Trong modal `CreateStudyPlanModal.tsx`:
* Thêm một mục **"Tài liệu học tập nguồn" (Source Documents)** dưới dạng checklist cho phép chọn nhiều tài liệu đã tải lên thư viện.
* Gửi danh sách `selectedDocIds` này lên Backend khi bấm tạo.
* Tích hợp nút **"Generate with AI"** để tự động điền các trường thông tin và tự động chọn tài liệu tương ứng dựa trên môn học.

### Bước 3: Cải tiến Prompt AI sinh lộ trình (AI Prompt Engineering)
Khi người dùng bấm tạo kế hoạch bằng AI:
* Backend lấy thông tin tóm tắt hoặc cấu trúc chương/mục lục của các tài liệu được chọn.
* Đưa vào Prompt gửi LLM:
  > *"Hãy lập một kế hoạch học tập chi tiết gồm các bài học/mốc học tập cụ thể dựa trên nội dung chính của tài liệu sau đây: [Thông tin/Tóm tắt tài liệu]. Phân bổ thời gian học hợp lý..."*
