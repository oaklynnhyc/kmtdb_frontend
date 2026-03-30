import { BookOpen, Users, Archive, Search } from "lucide-react";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="ink-header text-white py-20 hero-section relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl mb-6 font-medium">
              國民黨職名錄
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed mb-10">
              本系統典藏歷史性國民黨職名錄資料，提供研究人員與史學工作者存取二十世紀重要政治史料。
              內容涵蓋黨務人事基本資料、任職時間、組織層級及相關檔案文獻，為政治史與社會史研究提供可靠的一手資料來源。
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/registry">
                <button className="gold-button px-8 py-3 rounded-lg text-lg font-medium">
                  開始檢索
                </button>
              </Link>
              <Link to="/chat">
                <button className="ink-button px-8 py-3 rounded-lg text-lg font-medium">
                  研究助理
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      {/* About Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="paper-card rounded-lg p-8 seal-corner mb-12">
          <h2 className="text-3xl mb-6 ink-text section-title">
            關於本典藏系統
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              本數位典藏系統保存並開放歷史性國民黨職名錄資料，時間跨度涵蓋二十世紀中後期重要政治發展時期。
              典藏內容包含中央執行委員會、中央監察委員會、各級黨部組織、功能委員會及其所屬單位之重要職務記錄，
              完整記錄人事基本資料、任職時間、組織層級、職位異動等訊息。
            </p>
            <p>
              本系統為學術研究、圖書館服務、檔案館典藏管理提供重要支援。所有資料經過數位化處理、
              編目整理與內容標註，確保資料品質與檢索效能。研究人員可透過多元檢索條件，快速定位所需史料，
              支援政治史、組織史、人事研究等多面向研究工作。
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="cloud-divider mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e8d4a0] to-[#d4af37] flex items-center justify-center">
                <Archive className="w-6 h-6 text-[#2c3e50]" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                完整典藏
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              典藏多筆歷史職名錄資料，涵蓋不同時期、組織層級與職位類型，提供完整研究素材。
            </p>
          </div>

          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                多元檢索
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              支援姓名、職位、單位、時間等多種檢索條件，並提供進階Boolean查詢功能。
            </p>
          </div>

          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#bdc3c7] to-[#7f8c8d] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                詳實記錄
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              每筆資料包含完整職務資訊、任期記錄、異動原因及文獻來源，便於深入分析。
            </p>
          </div>

          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c9a832] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                研究支援
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              提供智慧型研究助理，協助導覽系統、解答疑問，提升研究效率。
            </p>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="cloud-divider my-12"></div>

        <div className="paper-card rounded-lg p-8 seal-corner">
          <h3 className="text-2xl mb-6 ink-text section-title">
            使用指引
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="seal-left">
              <h4 className="text-lg mb-3 ink-text font-medium">
                學術研究使用
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                本系統提供學術研究所需之一手史料。所有資料皆經過驗證並註明來源出處。
                進行學術發表時，請依學術規範引用本典藏系統，具體引用格式請參考凡例頁面。
              </p>
            </div>
            <div className="seal-left">
              <h4 className="text-lg mb-3 ink-text font-medium">
                隱私權說明
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                本典藏系統收錄之資料為歷史性公共資料，當事人為參與公共政治活動之歷史人物。
                系統在呈現歷史資訊時，遵循學術倫理與史料保存原則。
              </p>
            </div>
            <div className="seal-left">
              <h4 className="text-lg mb-3 ink-text font-medium">
                資料引用
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                本典藏系統資料可供教育與研究使用。引用時請註明人物姓名、職位、任期、
                查詢日期及本系統網址。詳細引用規範請參閱凡例頁面說明。
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/history"
            className="paper-card rounded-lg p-6 paper-card-hover ink-border block"
          >
            <h4 className="text-lg font-medium ink-text mb-2 seal-left">
              組織沿革
            </h4>
            <p className="text-sm text-gray-600">
              瞭解國民黨自創建至今的重要歷史事件與組織變革
            </p>
          </Link>
          <Link
            to="/editorial"
            className="paper-card rounded-lg p-6 paper-card-hover ink-border block"
          >
            <h4 className="text-lg font-medium ink-text mb-2 seal-left">
              凡例說明
            </h4>
            <p className="text-sm text-gray-600">
              查看職名錄資料編輯體例與學術引用規範
            </p>
          </Link>
          <Link
            to="/registry"
            className="paper-card rounded-lg p-6 paper-card-hover ink-border block"
          >
            <h4 className="text-lg font-medium ink-text mb-2 seal-left">
              開始檢索
            </h4>
            <p className="text-sm text-gray-600">
              立即開始查詢國民黨職名錄與任期資料
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}