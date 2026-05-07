📘 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
🎯 Project: Web hỗ trợ người khiếm thính (Sign Language Support System)
1. 📌 GIỚI THIỆU
1.1 Mục đích

Tài liệu này mô tả các yêu cầu chức năng và phi chức năng cho hệ thống web hỗ trợ người khiếm thính, bao gồm:

Dịch giữa văn bản và ngôn ngữ ký hiệu
Học tập (bài giảng, video)
Ghi nhớ (flashcard)
Hỗ trợ giao tiếp (AI chatbot)
1.2 Phạm vi hệ thống

Hệ thống cho phép:

Người dùng học và sử dụng ngôn ngữ ký hiệu
Giao tiếp thông qua dịch realtime
Tương tác với AI chatbot
1.3 Định nghĩa & thuật ngữ
Thuật ngữ	    Ý nghĩa
Sign Language	Ngôn ngữ ký hiệu
Sign Detection	Nhận diện cử chỉ
Sign Rendering	Hiển thị ký hiệu
CV	Computer Vision
Realtime	Xử lý thời gian thực
2. 🧑‍💻 TỔNG QUAN HỆ THỐNG
2.1 Actors
Guest (chưa đăng nhập)
User (người dùng thường)
Admin (quản trị)
2.2 Use Case tổng
ID	Use Case
UC01	Đăng ký / Đăng nhập / Đăng xuất
UC02	Text → Sign
UC03	Sign → Text
UC04	Xem bài giảng
UC05	Chơi flashcard
UC06	Chat với AI
UC07	Quản lý nội dung (Admin)
3. ⚙️ CHỨC NĂNG CHÍNH (FUNCTIONAL REQUIREMENTS)
🔹 3.1 Authentication
FR-01: Đăng ký
Input: email, password
Output: account created
FR-02: Đăng nhập
JWT authentication
FR-03: Đăng xuất
🔹 3.2 Text → Sign (Dịch văn bản sang ký hiệu)
FR-03
Input: text
Output: animation / sequence of signs
Flow:
User nhập text
→ gọi API ngoài (sign translation)
→ nhận JSON gestures
→ render bằng Canvas/SVG
🔹 3.3 Sign → Text (Realtime)
FR-04
Input: webcam stream
Output: text
Flow:
Camera → MediaPipe
→ detect keypoints
→ TensorFlow.js model
→ text output
🔹 3.4 Learning (Bài giảng)
FR-05
Xem danh sách bài học
Filter/search
FR-06
Xem chi tiết:
text
video
🔹 3.5 Flashcard Game
FR-07
Hiển thị sign → đoán nghĩa
hoặc text → chọn sign
FR-08
Tracking score
🔹 3.6 AI Chatbot
FR-09
Chat text
AI trả lời đơn giản, dễ hiểu
FR-10
Option: giải thích sign language
🔹 3.7 Admin
FR-11
CRUD bài giảng
FR-12
Quản lý user
4. 🧩 NON-FUNCTIONAL REQUIREMENTS
🔹 4.1 Performance
Realtime sign detection < 100ms latency
UI load < 2s
🔹 4.2 Scalability
Backend: FastAPI + PostgreSQL
Có thể scale API riêng
🔹 4.3 Usability
UI đơn giản
font dễ đọc
hỗ trợ người khiếm thính
🔹 4.4 Security
JWT auth
HTTPS
Rate limiting API
🔹 4.5 Reliability
Retry API translation
fallback nếu CV fail
5. 🏗️ SYSTEM ARCHITECTURE
5.1 Tổng thể
Frontend (React)
 ├── UI (shadcn)
 ├── State (dùng custom hooks)
 ├── CV (MediaPipe + TFJS)
 ├── Canvas Rendering

Backend (FastAPI)
 ├── Auth
 ├── Content API
 ├── Chat API

External APIs
 ├── Sign translation API
 ├── OpenAI / Gemini

Database
 └── PostgreSQL
5.2 Luồng dữ liệu quan trọng
🎥 Sign → Text
Camera
→ MediaPipe
→ Keypoints
→ TFJS model
→ Text
→ UI
📝 Text → Sign
Text input
→ External API
→ Gesture JSON
→ Canvas render
6. 🗂️ DATABASE DESIGN (cơ bản)
Users
id
email
password
role
Lessons
id
title
content
video_url
Flashcards
id
word
sign_data