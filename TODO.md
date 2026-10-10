# TODO — Cấu hình bảo mật trước khi publish EasyTrip

Checklist các bước cần làm **trên Firebase / Google Cloud Console** (không nằm trong repo).
Làm xong đánh dấu `[x]`.

## 1. Bật Anonymous Authentication (BẮT BUỘC)

> Nếu bỏ bước này, app vẫn đọc được nhưng mọi thao tác ghi sẽ thất bại âm thầm.

- [ ] Mở https://console.firebase.google.com → chọn project **sending-5a2ed**
- [ ] Menu trái: **Build → Authentication**
- [ ] Nếu chưa bật lần nào, bấm **Get started**
- [ ] Tab **Sign-in method** → tìm **Anonymous** trong danh sách Native providers → bấm vào
- [ ] Gạt công tắc **Enable** → **Save**

## 2. Deploy Firestore Security Rules

### Cách A — Dán trực tiếp trên console (dễ nhất, không cần cài gì)

- [ ] Firebase Console → **Build → Firestore Database → tab Rules**
- [ ] Xóa nội dung cũ
- [ ] Dán toàn bộ nội dung file `firestore.rules` trong repo
- [ ] Bấm **Publish**

### Cách B — Dùng Firebase CLI

- [ ] `npm install -g firebase-tools`
- [ ] `firebase login`
- [ ] `firebase use --add`  (chọn project `sending-5a2ed`, đặt alias `default`)
- [ ] `firebase deploy --only firestore:rules`  (chạy trong `D:\Work\EasyTrip`)

## 3. Giới hạn API key (giảm rủi ro lạm dụng quota/billing)

- [ ] Google Cloud Console → **APIs & Services → Credentials**
- [ ] Chọn Firebase browser key đang dùng
- [ ] **Application restriction** = **Websites**
- [ ] Thêm domain thật, ví dụ `knightbid.github.io/*`
- [ ] Save

## 4. Bật Firebase App Check (chặn request ngoài app)

- [ ] Firebase Console → **Build → App Check**
- [ ] Đăng ký app web với **reCAPTCHA v3**
- [ ] Lấy site key / secret key và dán vào cấu hình
- [ ] Bật enforcement cho Firestore sau khi đã chạy thử ổn

## 5. Quy tắc về Gemini API key

- [ ] **KHÔNG** dán Gemini API key trực tiếp vào `index.html` (key trong JS tĩnh sẽ bị bot GitHub lấy ngay)
- [ ] Muốn dùng AI khi publish: gọi Gemini qua backend trung gian (Cloud Functions / proxy)
      hoặc để người dùng tự nhập key vào `localStorage`
- [ ] Xác nhận `.gitignore` đã chặn `*.local` và các file `.env*`

## 6. Kiểm tra sau khi deploy

- [ ] Mở app, bấm **F12** → Console, không thấy log `Anonymous sign-in failed`
- [ ] Thử tạo 1 chuyến đi và lưu được
- [ ] Nếu log báo `Missing or insufficient permissions` → Anonymous chưa bật hoặc rules chưa publish

## Việc tùy chọn trong repo

- [ ] Dọn các file React/Vite cũ không dùng: `App.tsx`, `components/`, `services/`, `app.js`, `index.tsx`
