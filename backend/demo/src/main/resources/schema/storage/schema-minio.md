# MinIO Object Storage Schema
**Hệ thống:** Translating System in Real-Time for people with hearing impairment

Tài liệu này định nghĩa cấu trúc buckets, quy tắc đặt tên (Object Key), Metadata chuẩn và chiến lược bảo mật cho hệ thống lưu trữ MinIO.

## 1. Bucket Topology & Mục Đích

Hệ thống phân mảnh dữ liệu thành 3 buckets biệt lập để dễ dàng áp dụng các chính sách vòng đời (Lifecycle) khác nhau:

| Tên Bucket | Use Case | Mục đích | Lifecycle Policy |
| :--- | :--- | :--- | :--- |
| `sl-raw-input` | UC1, UC2 | Lưu video chunk (realtime) hoặc audio/video tải lên. Dữ liệu tạm để AI xử lý. | Tự động xóa sau **7-30 ngày**. |
| `sl-gesture-assets` | UC2 | Thư viện "Từ điển cử chỉ" chuẩn (Sign Language Dictionary). | **Giữ vĩnh viễn** (Không tự xóa). |
| `sl-render-output` | UC2 | Video thành phẩm sau khi Server ghép các asset lại. | Giữ lâu dài (Archive). |

---

## 2. Object Key Convention (Cấu trúc Đường dẫn)
**Nguyên tắc:** Thiết kế Key minh bạch, nhìn Key là truy được ngay ngữ cảnh (Session, Input, Version) mà không cần chui vào Database.

### A. Bucket: `sl-raw-input`
* **Realtime Video Chunks (UC1):**
  `raw-chunks/{sessionId}/{chunkIndex}.mp4`
* **File Nguyên Bản (UC2 - Audio/Text to Sign):**
  `raw-input/{sessionId}/{inputId}_{uuid}.ext`

### B. Bucket: `sl-gesture-assets`
* **Thư viện Cử chỉ Mẫu (UC2):**
  `gesture-assets/{language}/{gloss}/v{version}.mp4`
  *(Ví dụ: `gesture-assets/vi/xin_chao/v1.mp4`)*

### C. Bucket: `sl-render-output`
* **Video Hoàn Thành (UC2):**
  `render-output/{sessionId}/{jobId}/final.mp4`

---

## 3. Standard Metadata
Mỗi Object khi upload bắt buộc/khuyến khích đính kèm các User-Defined Metadata sau để phục vụ tracking và analytic:

* `x-amz-meta-session-id`: ID của phiên dịch (Bắt buộc).
* `x-amz-meta-reference-id`: `input_id` / `chunk_id` / `job_id` tùy ngữ cảnh.
* `x-amz-meta-user-id`: Định danh người dùng.
* `x-amz-meta-source`: Nguồn gốc sinh ra file (`uc1`, `uc2`, `system`).
* `x-amz-meta-duration-sec`: Thời lượng media (Dùng cho FE làm timeline playlist).

---

## 4. URL & Security Strategy
Hệ thống KHÔNG Public bất kỳ Bucket nào và tuân thủ các rule sau:

1. **Database Strategy:** PostgreSQL **chỉ lưu Object Path** ổn định (VD: `sl-raw-input/raw-chunks/123/0.mp4`). Tuyệt đối không lưu Presigned URL vào DB vì chúng sẽ hết hạn.
2. **Upload (Client -> MinIO):** Backend cấp **Presigned PUT URL** (TTL: 5-15 phút) để Client đẩy file thẳng lên MinIO, giảm tải băng thông cho Spring Boot.
3. **Download/Stream (MinIO -> Client):** Khi cần tải/xem, Backend cấp **Presigned GET URL** (TTL: 1-2 giờ). Frontend dùng URL này gán vào thẻ `<video>`.

---

## 5. Demo Constraints & Limits
Để tránh lỗi OOM (Out of Memory) hoặc nghẽn băng thông mạng nội bộ khi bảo vệ đồ án:

* **Audio Input:** Max `5MB`.
* **Video Chunk:** Max `2MB/chunk`.
* **Render Output:** Max `20MB`.

---

## 6. Lệnh Triển khai nhanh (Deployment Scripts)
Sử dụng MinIO Client (`mc`) để khởi tạo hạ tầng lưu trữ tự động.

```bash
# 1. Setup alias kết nối tới local MinIO
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# 2. Khởi tạo 3 Buckets
mc mb myminio/sl-raw-input
mc mb myminio/sl-gesture-assets
mc mb myminio/sl-render-output

# 3. Tạo file policy tự xóa (lifecycle.json) cho bucket sl-raw-input (7 ngày)
cat > lifecycle.json << 'EOF'
{
    "Rules": [
        {
            "Expiration": {
                "Days": 7
            },
            "ID": "Delete-old-raw-inputs",
            "Filter": {
                "Prefix": ""
            },
            "Status": "Enabled"
        }
    ]
}
EOF

# 4. Áp dụng Lifecycle policy
mc ilm import myminio/sl-raw-input < lifecycle.json