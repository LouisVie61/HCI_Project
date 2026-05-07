import { useAuth } from '../hooks';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">🤟 Sign Language</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Xin chào, {user?.email} 👋
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* Feature Cards */}
            <FeatureCard
              icon="📝"
              title="Bài giảng"
              description="Học các bài giảng về ngôn ngữ ký hiệu"
            />
            <FeatureCard
              icon="🎮"
              title="Flashcard"
              description="Luyện tập bằng trò chơi flashcard"
            />
            <FeatureCard
              icon="🎥"
              title="Nhận diện ký hiệu"
              description="Dịch ký hiệu thành text bằng camera"
            />
            <FeatureCard
              icon="✍️"
              title="Dịch Text"
              description="Dịch text thành ký hiệu để học"
            />
            <FeatureCard
              icon="💬"
              title="Chat AI"
              description="Trò chuyện với AI có thể giải thích ký hiệu"
            />
            <FeatureCard
              icon="👤"
              title="Hồ sơ"
              description="Quản lý thông tin cá nhân của bạn"
            />
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
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);
