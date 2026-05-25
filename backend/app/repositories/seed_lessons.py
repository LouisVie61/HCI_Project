# seed_lessons.py
# cd cd D:\2026\HCI_Project\backend\app
# chạy python -m repositories.seed_lessons để tạo dữ liệu mẫu cho bảng lessons

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

    Lesson(title="Bài 11: 5 cụm từ thường dùng",
               description="5 cụm từ thông dụng trong ngôn ngữ ký hiệu",
               content="https://www.youtube.com/watch?v=Gc8rLkVjX6Q",
               difficulty="beginner", order_index=11, is_published=True),

    Lesson(title="Bài 12: Cuộc sống thật nhiều màu",
           description="Cuộc sống thật nhiều màu",
           content="https://www.youtube.com/watch?v=8FCJ8ipEg0M",
           difficulty="beginner", order_index=12, is_published=True),

    Lesson(title="Bài 13: Vẽ tranh khó hay dễ?",
           description="Học cách vẽ tranh bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=yE5dmVyGzXA",
           difficulty="beginner", order_index=13, is_published=True),

    Lesson(title="Bài 14: Thế giới động vật thật kỳ diệu",
           description="Học về thế giới động vật bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=822oDJgRHfQ",
           difficulty="beginner", order_index=14, is_published=True),

    Lesson(title="Bài 15: Khu vườn nhiều màu sắc",
           description="Vẽ khu vườn nhiều màu sắc bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=91kS-b6UlGY",
           difficulty="beginner", order_index=15, is_published=True),

    Lesson(title="Bài 16: Gia đình mình thật vui",
           description="Vẽ gia đình mình thật vui bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=DUmOu0zCtY8",
           difficulty="intermediate", order_index=16, is_published=True),

    Lesson(title="Bài 17: Sáng tạo tranh từ bàn tay, tại sao không?",
           description="Vẽ tranh sáng tạo từ bàn tay bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=sK5G-qZ1SXo",
           difficulty="intermediate", order_index=17, is_published=True),

    Lesson(title="Bài 18: Cùng trang trí đồ dùng học tập nào",
           description="Trang trí đồ dùng học tập bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=MhvNodzbcY8",
           difficulty="intermediate", order_index=18, is_published=True),

    Lesson(title="Bài 19: Bí mật của giấc ngủ - Noriko Kimura",
           description="Đọc truyện Bí mật của giấc ngủ bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=WJBzEhDQmCg",
           difficulty="intermediate", order_index=19, is_published=True),

    Lesson(title="Bài 20: Bí mật của chiều cao",
           description="Đọc truyện Bí mật của chiều cao bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=Do4xmzqZp8I",
           difficulty="advanced", order_index=20, is_published=True),

    Lesson(title="Bài 21: Mẹ có phải mẹ của con -P.D. Eastman",
           description="Đọc truyện Mẹ có phải mẹ của con bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=L_veqQPAyAY",
           difficulty="beginner", order_index=21, is_published=True),

    Lesson(title="Bài 22: Bảng chữ cái ngôn ngữ ký hiệu",
           description="Học bảng chữ cái ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=ggQY-g4aQp8",
           difficulty="beginner", order_index=22, is_published=True),

    Lesson(title="Bài 23: Bí mật của trái tim - tác giả Noriko Kimura",
           description="Đọc truyện Bí mật của trái tim bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=EhBINtK_nl4",
           difficulty="beginner", order_index=23, is_published=True),

    Lesson(title="Bài 24: Con yêu bố vô cùng",
           description="Đọc truyện Con yêu bố vô cùng bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=PYvMCa5Q4Is",
           difficulty="beginner", order_index=24, is_published=True),

    Lesson(title="Bài 25: Múp míp mê mẩn múa may",
           description="Đọc sách Múp míp mê mẩn múa may bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=iKFGFgvQS2w",
           difficulty="beginner", order_index=25, is_published=True),

    Lesson(title="Bài 26: Ôm tớ một cái đi mà",
           description="Đọc truyện Ôm tớ một cái đi mà bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=xR3-HJUmhsY",
           difficulty="intermediate", order_index=26, is_published=True),

    Lesson(title="Bài 27: Vèo vèo Hội An",
           description="Đọc truyện Vèo vèo Hội An bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=aWMNot7mpwk",
           difficulty="intermediate", order_index=27, is_published=True),

    Lesson(title="Bài 28: Bài thơ Lau nước mũi",
           description="Bài thơ Lau nước mũi bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=2jnfAEjfOsk",
           difficulty="intermediate", order_index=28, is_published=True),

    Lesson(title="Bài 29: Bài thơ Ôm một cái",
           description="Bài thơ Ôm một cái bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=THrAR_j8K6Q",
           difficulty="intermediate", order_index=29, is_published=True),

    Lesson(title="Bài 30: Bài thơ Biết yêu thương",
           description="Bài thơ Biết yêu thương bằng ngôn ngữ ký hiệu",
           content="https://www.youtube.com/watch?v=7qvtCQ5c6rc",
           difficulty="advanced", order_index=30, is_published=True),
]

db.add_all(lessons)
db.commit()
db.close()

print(f"Đã tạo {len(lessons)} bài học thành công!")