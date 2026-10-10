<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Ac_9e0bXx_7yHaOamcIviKwzx3ahG929

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Kiến trúc

Ứng dụng chạy thực tế nằm trong **`index.html`** (HTML/JS thuần + Tailwind CDN), dữ liệu lưu trên
**Firebase Firestore** và đồng bộ realtime. Thư mục `App.tsx`, `components/`, `services/` là bản
React/Vite cũ, hiện **không được dùng** (chỉ mang tính tham khảo).

## Bảo mật (đọc trước khi publish)

Firebase Web API key trong `index.html` là **công khai theo thiết kế**, không phải bí mật. Rủi ro
thật nằm ở Firestore Rules và giới hạn API key. Checklist khi deploy:

1. **Firestore Security Rules** — deploy `firestore.rules` kèm repo:
   ```
   firebase deploy --only firestore:rules
   ```
   Rules yêu cầu đăng nhập mới được ghi. Vì vậy phải bật provider:
   **Firebase Console → Authentication → Sign-in method → Anonymous → Enable**.
   (App đã tự gọi `signInAnonymously` khi khởi động.)
2. **Giới hạn API key** — Google Cloud Console → Credentials → chọn key → *Application
   restriction* = **Websites**, chỉ thêm domain thật (ví dụ `knightbid.github.io`).
3. **App Check** — bật reCAPTCHA v3 (Firebase Console → App Check) để chặn request ngoài app.
4. **KHÔNG** dán Gemini API key trực tiếp vào `index.html`. Key nằm trong JS tĩnh sẽ bị bot
   GitHub lấy ngay. Muốn dùng AI khi publish, hãy gọi Gemini qua backend trung gian
   (Cloud Functions / proxy), hoặc để người dùng tự nhập key và lưu trong `localStorage`.
5. `*.local` và file `.env*` đã được `.gitignore` — không commit key vào git.
