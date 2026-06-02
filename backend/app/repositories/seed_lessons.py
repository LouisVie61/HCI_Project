# seed_lessons.py
# cd cd D:\2026\HCI_Project\backend\app
# chạy python -m repositories.seed_lessons để tạo dữ liệu mẫu cho bảng lessons

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from models.lesson import Lesson, LessonProgress

db = SessionLocal()

lessons = [
    Lesson(title="American Sign Language - ASL Lesson 01",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=k9cFqNYlV1A&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=1",
           difficulty="beginner", order_index=1, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 02",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=7RTXVJUbByE&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=3",
           difficulty="beginner", order_index=2, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 03",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=64p4LL7INCQ&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=4",
           difficulty="beginner", order_index=3, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 04",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=ZJYzIgjCJZw&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=5",
           difficulty="beginner", order_index=4, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 05",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=1_SpSwMO4zc&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=6",
           difficulty="beginner", order_index=5, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 06",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=wcllK4q5Skw&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=7",
           difficulty="intermediate", order_index=6, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 07",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=kHg4wAOF4X0&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=8",
           difficulty="intermediate", order_index=7, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 08",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=ywVprzOuMoE&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=9",
           difficulty="intermediate", order_index=8, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 09",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=ibiemRb9ZCM&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=11",
           difficulty="intermediate", order_index=9, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 10",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=ie3Rjv3Rimk&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=12",
           difficulty="advanced", order_index=10, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 11",
               description="American Sign Language",
               content="https://www.youtube.com/watch?v=G2n-BcZezMI&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=13",
               difficulty="beginner", order_index=11, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 12",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=lTpaji0BdQI&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl",
           difficulty="beginner", order_index=12, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 13",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=N5DmGu0-nj8&list=PL6akqFwEeSphJ6rd50AtRBKNGracfavCi&index=17",
           difficulty="beginner", order_index=13, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 14",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=mL1hs9U14a8&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=2",
           difficulty="beginner", order_index=14, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 15",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=9iYXQ2qmjB0&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=5",
           difficulty="beginner", order_index=15, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 16",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=Tkn4QCCq6N4&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=7",
           difficulty="intermediate", order_index=16, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 17",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=iio24Mh-FKQ&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=8",
           difficulty="intermediate", order_index=17, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 18",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=RK6yGjex2_w&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=9",
           difficulty="intermediate", order_index=18, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 19",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=KuJOzDiaS-I&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=10",
           difficulty="intermediate", order_index=19, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 20",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=Sv4rpRcedus&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=11",
           difficulty="advanced", order_index=20, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 21",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=nSEz9u-ZjKU&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=12",
           difficulty="beginner", order_index=21, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 22",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=Lya0-Q081Ho&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=13",
           difficulty="beginner", order_index=22, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 23",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=PHOrqAvwCG4&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=14",
           difficulty="beginner", order_index=23, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 24",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=bm6aMRpy_LM&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=15",
           difficulty="beginner", order_index=24, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 25",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=2Px_hcmocMU&list=PL6akqFwEeSpjKM_JKDGGrXdvQm21Ahzkl&index=16",
           difficulty="beginner", order_index=25, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 26",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=hzb5c1Gl8k8&list=PL6akqFwEeSpgI1uukfFiKLCIQzP4nd2yx",
           difficulty="intermediate", order_index=26, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 27",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=_5a11DaZiuU&list=PL6akqFwEeSpgI1uukfFiKLCIQzP4nd2yx&index=3",
           difficulty="intermediate", order_index=27, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 28",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=wYMK6O-TvEw&list=PL6akqFwEeSpgI1uukfFiKLCIQzP4nd2yx&index=4",
           difficulty="intermediate", order_index=28, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 29",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=OeZbHQF9GNg&list=PL6akqFwEeSpgI1uukfFiKLCIQzP4nd2yx&index=5",
           difficulty="intermediate", order_index=29, is_published=True),

    Lesson(title="American Sign Language - ASL Lesson 30",
           description="American Sign Language",
           content="https://www.youtube.com/watch?v=QqwhGuxtJLk&list=PL6akqFwEeSpgI1uukfFiKLCIQzP4nd2yx&index=7",
           difficulty="advanced", order_index=30, is_published=True),
]

db.query(LessonProgress).delete()
db.query(Lesson).delete()
db.commit()

db.add_all(lessons)
db.commit()
db.close()

print(f"Đã tạo {len(lessons)} bài học thành công!")