# seed_lessons.py
# Chạy: python seed_lessons.py (từ thư mục app/)
# cd cd D:\2026\HCI_Project\backend\app
# chạy python seed_lessons.py để tạo dữ liệu mẫu cho bảng lessons

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from models.lesson import Lesson

db = SessionLocal()

lessons = [
    Lesson(title="Bài 1: Số đếm cơ bản",
           description="Học các ký hiệu số đếm thông dụng trong ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=IIpqKhBOAj8",
           difficulty="beginner", order_index=1, is_published=True),

    Lesson(title="Bài 2: Bảng chữ cái cơ bản",
           description="Học các ký hiệu bảng chữ cái thông dụng trong ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=ggQY-g4aQp8",
           difficulty="beginner", order_index=2, is_published=True),

    Lesson(title="Bài 3: Giới thiệu bản thân",
           description="Học cách giới thiệu bản thân",
           content="https://www.youtube.com/watch?v=YSPRe4TeTxw",
           difficulty="beginner", order_index=3, is_published=True),

    Lesson(title="Bài 4: Giới thiệu bản thân (P2)",
           description="Học cách giới thiệu bản thân",
           content="https://www.youtube.com/watch?v=hLEQuuht_wI",
           difficulty="beginner", order_index=4, is_published=True),

    Lesson(title="Bài 5: Chủ đề cảm xúc",
           description="Chủ đề về cảm xúc",
           content="https://www.youtube.com/watch?v=0mfbK1kbzlM",
           difficulty="beginner", order_index=5, is_published=True),

    Lesson(title="Bài 6: Chủ đề về chữ A",
           description="Ký hiệu về chữ A",
           content="https://www.youtube.com/watch?v=Fq8xckriS1c",
           difficulty="intermediate", order_index=6, is_published=True),

    Lesson(title="Bài 7: Chủ đề về chữ B",
           description="Ký hiệu về chữ B",
           content="https://www.youtube.com/watch?v=aWMNot7mpwk",
           difficulty="intermediate", order_index=7, is_published=True),

    Lesson(title="Bài 8: Chủ đề về chữ C",
           description="Ký hiệu về chữ C",
           content="https://www.youtube.com/watch?v=qnBSeyiw1IE",
           difficulty="intermediate", order_index=8, is_published=True),

    Lesson(title="Bài 9: Chủ đề về chữ D",
           description="Ký hiệu về chữ D",
           content="https://www.youtube.com/watch?v=gfOX_HhxPWU",
           difficulty="intermediate", order_index=9, is_published=True),

    Lesson(title="Bài 10: Chủ đề về chữ E",
           description="Ký hiệu về chữ E",
           content="https://www.youtube.com/watch?v=kIfpgwnEito",
           difficulty="advanced", order_index=10, is_published=True),
]

db.add_all(lessons)
db.commit()
db.close()

print(f"Đã tạo {len(lessons)} bài học thành công!")