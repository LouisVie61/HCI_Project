import { useAuth } from "../hooks";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const openChat = () => {
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">🤟 Sign Language</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={openChat}>
              Mở Chat AI
            </Button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Xin chào, {user?.email} 👋</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* Feature Cards */}
            <FeatureCard icon="📝" title="Bài giảng" description="Học các bài giảng về ngôn ngữ ký hiệu" />
            <FeatureCard icon="🎮" title="Flashcard" description="Luyện tập bằng trò chơi flashcard" />
            <FeatureCard icon="🎥" title="Nhận diện ký hiệu" description="Dịch ký hiệu thành text bằng camera" />
            <FeatureCard icon="✍️" title="Dịch Text" description="Dịch text thành ký hiệu để học" />
            <FeatureCard icon="💬" title="Chat AI" description="Trò chuyện với AI có thể giải thích ký hiệu" actionLabel="Bắt đầu chat" onClick={openChat} />
            <FeatureCard icon="👤" title="Hồ sơ" description="Quản lý thông tin cá nhân của bạn" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onClick?: () => void;
}

const FeatureCard = ({ icon, title, description, actionLabel, onClick }: FeatureCardProps) => (
  <div className={`bg-gray-50 rounded-lg p-6 transition-all ${onClick ? "hover:shadow-md hover:-translate-y-0.5" : "hover:shadow-md"}`}>
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
    {onClick && actionLabel ? (
      <button onClick={onClick} className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700">
        {actionLabel}
      </button>
    ) : null}
  </div>
);
