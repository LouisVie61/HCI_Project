# Translating System in Real-Time for people with hearing impairment

## Prerequisites:

## Techstack

## Use case

### Use Case 1: Sign to Text (Video Streaming -> Text)
1. Nhận Video Chunk:
- controller: Nhận stream/chunk từ client.
- service: Gọi infrastructure/MinioStorageService để nén file Video vào MinIO. Lấy chunk_url trả về.
- service: Tạo bản ghi trong entity/StreamChunk đánh dấu status là UPLOADED và lưu chunk_url vào PostgreSQL.

2. Trích xuất Đặc trưng (Feature Extraction):
- Worker/Model AI đọc file từ MinIO.
- AI nhả ra một cục tọa độ (keypoints) khổng lồ. service lưu cục JSON này vào MongoDB (collection feature_docs).
- service cập nhật feature_doc_id ngược lại vào bảng StreamChunk trong PostgreSQL.

3. Xử lý Rule Engine & Lưu Transcript:
- Model nhả ra các candidate tokens. Các bước Rule Engine (fix grammar, merge) được log nháp vào MongoDB (collection transcript_candidates) để sau này debug hoặc fine-tune AI.
- Câu dịch chốt cuối cùng được service lưu thành bản ghi chuẩn trong PostgreSQL (entity/Transcript).
- Bắn text realtime qua WebSocket về Client.

### Use Case 2: Text/Speech to Sign (Audio/Text -> Video)
1. Nhận Input:
- Nếu là Audio: Tương tự UC1, quăng file vào MinIO, lưu URL vào bảng SessionInput trong PostgreSQL. Đẩy qua STT lấy Text.

2. NLP & Mapping:
- Bóc tách Intent/Keyword. Quá trình bóc tách tại sao lại ra keyword này được log lại vào MongoDB (nlp_extractions).
- service gọi repository/GestureMappingRepository (đọc từ PostgreSQL) để tìm ID của đoạn video cử chỉ tương ứng. Nếu cần tìm kiếm tương đồng nâng cao (vector search), service sẽ query thêm gesture_metadata từ MongoDB.

3. Render Kịch bản:
- service tạo một SignRenderJob trong PostgreSQL để theo dõi trạng thái ghép video.
- Hệ thống bốc các đoạn video mẫu từ MinIO (thông qua URL lưu ở Postgres), tiến hành ghép lại.
- Video hoàn chỉnh được upload ngược lên MinIO. URL cuối cùng được cập nhật vào PostgreSQL và trả về cho Client.

### Note: Postgres is the Source of Truth

## Database:

1. Phân vai chi tiết từng Database
- MinIO (Object Storage)
    - Lưu gì? Chỉ lưu file nhị phân (Binary data). Các đoạn video người dùng quay (chunks), file ghi âm tiếng nói, file video/animation cử chỉ mẫu (gesture assets), và video kết quả cuối cùng đã render.
    - Server cần gì? Server chỉ cần tải file lên (Upload) và lấy cái URL (đường dẫn) về để lưu vào DB, hoặc cấp URL đó cho Client để Client tự stream video/audio.

- PostgreSQL (Core Relational DB)
    - Lưu gì? Dữ liệu có cấu trúc chặt chẽ, quan hệ rõ ràng (ACID) và kích thước nhỏ.
    - Quản lý người dùng & Phiên: users, sessions.
    - Quản lý trạng thái (State Machine): stream_chunks (đang xử lý hay đã xong?), sign_render_jobs (đang queue hay render lỗi?).
    - Danh mục cốt lõi: Danh sách từ vựng cá nhân (user_vocabulary), danh sách cử chỉ (gesture_assets - chỉ chứa tên, URL, thời lượng).
    - Kết quả cuối cùng: Câu dịch chốt (transcripts), chuỗi video cần ghép (sign_render_segments).
    - Server cần gì? Server gọi Postgres liên tục để kiểm tra quyền hạn, thay đổi trạng thái tiến trình (ví dụ: đánh dấu chunk này đã xử lý xong), và để JOIN các bảng lấy kết quả hiển thị cho người dùng (lịch sử dịch).

- MongoDB (NoSQL / AI-Data DB)
    - Lưu gì? Dữ liệu lộn xộn, mảng (array) lồng nhau sâu, ma trận, vector, và nhật ký cực lớn. Nếu nhét những thứ này vào SQL sẽ làm DB chết rục.
    - Toạ độ cơ thể (Keypoints): feature_docs (chứa hàng ngàn toạ độ x, y, z của tay, mặt trong từng frame).
    - Quá trình AI suy nghĩ: transcript_candidates (AI nháp ra 3-4 câu, áp dụng rule này nọ mới chốt), nlp_extractions (NLP bóc tách keyword tại sao lại chọn gesture này).
    - Đặc trưng vector (Embeddings): gesture_metadata (lưu vector 128 chiều để tìm kiếm AI/Similarity Search).
    - Logs Pipeline: pipeline_logs, rule_engine_logs (tự động xóa sau 7-30 ngày).
    - Server cần gì? Nhánh xử lý AI của server (thường là Python/Worker) sẽ đọc/ghi vào đây liên tục. Nó ghi lại "nháp" để debug, lưu vector để tìm kiếm nhanh, và làm cầu nối dữ liệu lớn giữa các bước của ML model mà không làm chậm Postgres.