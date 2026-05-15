import { BookOpenCheck, Camera, Languages, MessageSquareText, Play, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatTile } from '../components/dashboard/DashboardShell';

const quickActions = [
  {
    path: '/dashboard/lessons',
    title: 'Học bài mới',
    description: 'Xem danh sách bài học và nội dung hướng dẫn.',
    icon: BookOpenCheck,
  },
  {
    path: '/dashboard/flashcards',
    title: 'Luyện flashcard',
    description: 'Ôn lại từ vựng bằng thẻ tương tác.',
    icon: Trophy,
  },
  {
    path: '/dashboard/translate',
    title: 'Dịch văn bản',
    description: 'Chuyển câu ngắn thành chuỗi ký hiệu.',
    icon: Languages,
  },
  {
    path: '/dashboard/recognition',
    title: 'Thử camera',
    description: 'Mở camera để chuẩn bị nhận diện ký hiệu.',
    icon: Camera,
  },
];

export const Dashboard = () => (
  <div className="space-y-6">
    <section className="overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-2xl shadow-slate-900/12">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-emerald-100">
            <Sparkles className="size-4" />
            Dashboard học tập cá nhân
          </div>
          <h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            Chọn một hoạt động và bắt đầu luyện ngôn ngữ ký hiệu ngay.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            Đây là trang tổng quan. Các chức năng học bài, flashcard, dịch text, nhận diện camera và chat AI đã được
            tách sang route riêng để dễ mở rộng.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/dashboard/lessons"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <Play className="size-4" />
              Bắt đầu học
            </Link>
            <Link
              to="/dashboard/chat"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <MessageSquareText className="size-4" />
              Hỏi AI
            </Link>
          </div>
        </div>

        <div className="grid content-end gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm text-slate-300">Chức năng</p>
            <p className="mt-2 text-3xl font-semibold text-white">6</p>
            <p className="mt-1 text-xs text-slate-400">Tách thành route riêng</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm text-slate-300">Trạng thái</p>
            <p className="mt-2 text-3xl font-semibold text-white">Demo</p>
            <p className="mt-1 text-xs text-slate-400">Sẵn sàng kết nối backend</p>
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {quickActions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.path}
            to={action.path}
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
          >
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-950 transition group-hover:bg-slate-950 group-hover:text-white">
              <Icon className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-950">{action.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
          </Link>
        );
      })}
    </section>
  </div>
);
