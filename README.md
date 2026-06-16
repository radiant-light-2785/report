# LME OCR - Hạch toán giao dịch

Bản này chạy dạng **static web** nên có thể upload thẳng lên GitHub và chạy bằng GitHub Pages. Không cần Python server, không cần Flask, không bị lỗi JSON API.

## Cách dùng nhanh

1. Giải nén file zip.
2. Upload toàn bộ file trong thư mục này lên một GitHub repository.
3. Bật GitHub Pages cho repository.
4. Mở link GitHub Pages và upload ảnh.

## File chính

| File | Công dụng |
|---|---|
| `index.html` | Trang web chính |
| `assets/app.js` | OCR, parse bảng, tính lãi/lỗ |
| `assets/style.css` | Giao diện |
| `.github/workflows/pages.yml` | Workflow deploy GitHub Pages |

## Cách upload lên GitHub

### Cách 1: Upload thủ công trên web GitHub

1. Tạo repository mới.
2. Bấm **Add file** → **Upload files**.
3. Kéo thả toàn bộ file/thư mục đã giải nén vào.
4. Bấm **Commit changes**.
5. Vào **Settings** → **Pages**.
6. Chọn source phù hợp và bật Pages.

### Cách 2: Dùng Git command

```bash
git init
git add .
git commit -m "Init LME OCR web"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Cách chạy thử trên máy trước khi upload

Mở thư mục này bằng VS Code rồi dùng Live Server, hoặc chạy:

```bash
python -m http.server 5500
```

Sau đó mở:

```text
http://127.0.0.1:5500
```

## Lưu ý OCR

- Ảnh càng rõ, ít bị cắt cột, chữ càng dễ đọc.
- Nếu OCR sai số, sửa trực tiếp trong ô bảng hoặc sửa phần **Raw OCR text** rồi bấm **Parse lại từ Raw OCR**.
- Bảng có thể thêm/xóa dòng thủ công.
- Có nút Copy Markdown và tải CSV.

## Công thức đang dùng

- 1 lot = 25 tấn.
- Phí giao dịch = 0.616 USD/mt/chiều.
- Phí 1 lot khứ hồi = 25 × 0.616 × 2 = 30.80 USD.
- Long: `(Giá đóng - Giá mở) × 25 × lot`.
- Short: `(Giá mở - Giá đóng) × 25 × lot`.
