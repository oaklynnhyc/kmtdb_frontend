import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export function RecordDetail() {
  return (
    <div className="min-h-screen">
      <div className="ink-header text-white py-12 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/registry">
            <button className="mb-4 text-white hover:text-gray-200 px-4 py-2 rounded hover:bg-white/10 transition-colors flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回名冊檢索
            </button>
          </Link>
          <h1 className="text-3xl mb-2">黨員資料</h1>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="paper-card rounded-lg seal-corner max-w-lg mx-auto">
          <div className="p-12 text-center">
            <Construction className="w-16 h-16 text-[#d4af37] mx-auto mb-6" />
            <h2 className="text-2xl mb-4 ink-text">功能開發中</h2>
            <p className="text-gray-600 mb-2">
              黨員資料查詢功能目前正在開發中
            </p>
            <p className="text-gray-500 text-sm mb-8">
              此功能將提供黨員個人資料的詳細檢視，敬請期待。
            </p>
            <Link to="/registry">
              <button className="ink-button px-6 py-2 rounded">
                前往名冊檢索
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
