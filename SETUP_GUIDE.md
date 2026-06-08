# Hướng Dẫn Cài Đặt LumiEdu

## 1. Clone dự án
```bash
git clone https://github.com/huynhduybinh24/SWP391_AIStudyHub.git
```

## 2. Cấu hình Frontend
Vào thư mục `FrontEnd`, tạo file `.env` với nội dung sau:
```env
VITE_API_BASE_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 3. Cấu hình Backend
Vào thư mục `BackEnd/src/main/resources`, tạo file `application-local.properties` with nội dung sau:
```properties
stripe.secret-key=your_stripe_secret_key_here
stripe.webhook-secret=your_stripe_webhook_secret_here
google.client-id=your_google_client_id_here
google.client-secret=your_google_client_secret_here
openai.api.key=your_openai_api_key_here
gemini.api.key=your_gemini_api_key_here
```

## 4. Chạy
```bash
# Backend
cd BackEnd
./mvnw spring-boot:run

# Frontend
cd FrontEnd
npm install
npm run dev
```

## Tài khoản test
- User: `student@lumiedu.com` / `123456`
- Admin: `admin@lumiedu.com` / `123456`

> ⚠️ File `.env` và `application-local.properties` đã được thêm vào `.gitignore` nên Git sẽ **tự động bỏ qua**, không push lên GitHub. Bạn không cần làm gì thêm.
>
> Kiểm tra bằng lệnh: `git status` — nếu không thấy 2 file trên trong danh sách là OK ✅

