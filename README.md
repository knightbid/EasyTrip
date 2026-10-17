# EasyTrip — Chia Tiền Đi Chơi (TripSplit AI)

Ứng dụng web quản lý chi tiêu nhóm khi đi chơi: tạo chuyến đi, thêm thành viên (có hệ số trẻ em),
ghi khoản chi, ứng tiền cho thủ quỹ, xem công nợ và gợi ý chuyển khoản.

## Chạy local

App là một file HTML tĩnh, không cần build. Cần Python để chạy web server đơn giản:

```
Start.bat
```

(tương đương `python -m http.server 8000`), rồi mở http://localhost:8000.

## Kiến trúc

- **`index.html`**: toàn bộ app (HTML/JS thuần + Tailwind CDN + Lucide icons).
- **Firebase Firestore**: lưu dữ liệu, đồng bộ realtime. **Firebase Auth (ẩn danh)**: mỗi trình duyệt có một uid.
- **`firestore.rules`**: phân quyền (xem bên dưới).

## Phân quyền

- Mỗi chuyến đi có `ownerId` (người tạo) và `editors` (danh sách uid được sửa).
- Trang chủ chỉ liệt kê chuyến đi mà bạn là editor.
- **Link xem** `#trip=<id>`: ai có link cũng xem được, không sửa được.
- **Link sửa** `#trip=<id>&key=<khóa>`: ai mở link sẽ được thêm vào `editors`. Khóa nằm trong
  collection `tripSecrets`, chỉ editor đọc được. Chỉ gửi link sửa cho người trong nhóm.
- Chỉ chủ chuyến đi mới xóa được chuyến đi.
- Chuyến đi tạo trước khi có phân quyền (chưa có `editors`) chỉ mở được bằng link xem; người đầu tiên
  bấm **"Nhận quyền sở hữu"** sẽ thành chủ.
- Đăng nhập ẩn danh gắn với trình duyệt: đổi máy hoặc xóa dữ liệu trình duyệt thì cần mở lại link sửa.

## Bảo mật (đọc trước khi publish)

Firebase Web API key trong `index.html` là **công khai theo thiết kế**, không phải bí mật. Rủi ro
thật nằm ở Firestore Rules và giới hạn API key. Checklist khi deploy (chi tiết trong `TODO.md`):

1. **Bật Anonymous Auth**: Firebase Console → Authentication → Sign-in method → Anonymous → Enable.
2. **Deploy Firestore Rules**: `firebase deploy --only firestore:rules`.
3. **Giới hạn API key**: Google Cloud Console → Credentials → *Application restriction* = **Websites**,
   chỉ thêm domain thật (ví dụ `<tên-github>.github.io`).
4. **App Check**: bật reCAPTCHA v3 (Firebase Console → App Check) để chặn request ngoài app.
5. **KHÔNG** dán Gemini API key trực tiếp vào `index.html`. Key nằm trong JS tĩnh sẽ bị bot
   GitHub lấy ngay. Muốn dùng AI khi publish, hãy gọi Gemini qua backend trung gian
   (Cloud Functions / proxy), hoặc để người dùng tự nhập key và lưu trong `localStorage`.
6. `*.local` và file `.env*` đã được `.gitignore`, không commit key vào git.
