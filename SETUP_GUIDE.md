# Hướng Dẫn Cài Đặt Nhanh LumiEdu

Tài liệu này giúp các thành viên cấu hình và chạy dự án nhanh nhất.

---

### Bước 1: Tạo File Cấu Hình (Copy & Paste)

Vì các file cấu hình nằm trong `.gitignore` (không được đẩy lên GitHub), bạn cần tạo thủ công 2 file sau:

#### 1. Tạo file `FrontEnd/.env`
```env
VITE_API_BASE_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY_HERE
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

#### 2. Tạo file `BackEnd/src/main/resources/application-local.properties`
```properties
stripe.secret-key=YOUR_STRIPE_SECRET_KEY_HERE
stripe.webhook-secret=whsec_mock_key_for_now
google.client-id=YOUR_GOOGLE_CLIENT_ID_HERE
google.client-secret=YOUR_GOOGLE_CLIENT_SECRET_HERE
openai.api.key=mock-key
gemini.api.key=YOUR_GEMINI_API_KEY_HERE
```
*(Thay `YOUR_GEMINI_API_KEY_HERE` bằng API Key cá nhân của bạn nếu muốn kiểm thử tính năng AI Chatbot).*

---

### Bước 2: Khởi Chạy Dự Án

Mở 2 cửa sổ Terminal độc lập để chạy đồng thời Backend và Frontend:

#### 1. Chạy Backend
```bash
cd BackEnd
./mvnw spring-boot:run
```

#### 2. Chạy Frontend
```bash
cd FrontEnd
npm install
npm run dev
```

---

### Bước 3: Đăng Nhập Tài Khoản Test

Sau khi giao diện chạy lên, bạn có thể đăng nhập bằng các tài khoản test sẵn có:
- **Tài khoản học viên:** `student@lumiedu.com` / mật khẩu `123456`
- **Tài khoản quản trị viên:** `admin@lumiedu.com` / mật khẩu `123456`

