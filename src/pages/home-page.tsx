import { BookOpen, Users, Archive, Search } from "lucide-react";
import { Link } from "react-router";
import { HomeAnnouncements } from "@/components/home-announcements";

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="ink-header text-white py-12 sm:py-16 lg:py-20 hero-section relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 font-medium">
              中國國民黨職名錄檢索系統
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-10">
              收錄中國國民黨黨務組織自興中會以降，至中國國民黨第十四屆中央委員會重要職名資料，
              建置人名、組織、職務、任期等結構化欄位，提供多元檢索與交互比對功能，
              便利研究者快速掌握組織沿革與人事異動脈絡，作為近現代台灣與中國政治史、人物關係與政黨運作研究的重要參考工具。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link to="/registry">
                <button className="gold-button w-full sm:w-auto px-8 py-3 rounded-lg text-base sm:text-lg font-medium">
                  開始檢索
                </button>
              </Link>
              <Link to="/chat">
                <button className="ink-button w-full sm:w-auto px-8 py-3 rounded-lg text-base sm:text-lg font-medium">
                  AI深度探索
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      {/* About Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* 最新消息／公告區塊（有公告才顯示，含自帶分隔線；置於「關於本檢索系統」之上）*/}
        <HomeAnnouncements />

        <div className="paper-card rounded-lg p-5 sm:p-8 seal-corner mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl mb-4 sm:mb-6 ink-text section-title">
            關於本檢索系統
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              本系統收錄自興中會至中國國民黨第十四屆中央委員會重要職名，提供人名、別名、組織單位、職務、任期等檢索欄位，輔助研究者檢視檔案得以參照。本系統以李雲漢主編，劉維開編之《中國國民黨職名錄》（臺北：中國國民黨中央委員會黨史委員會，1994年）為底本，並參照2014年中華書局修訂出版之《中國國民黨職名錄(1894-1994)》進行內容增補。
              <br /><br />
              本系統收錄之職名範圍，包括興中會、中國同盟會、國民黨、中華革命黨及中國國民黨(1924年改組前)之職名，以及自1924年第一屆中央執行、監察委員會起，按屆輯錄中央執行委員、中央監察委員、候補中央執行委員、候補中央監察委員、中央評議委員、中央委員、候補中央委員，暨中央黨部各單位正、副主管姓名，並附注相關任免資料。此外，本系統亦導入語言模型技術，開發AI深度探索功能，不僅提供國民黨組織沿革及人事異動之詢答服務，也結合本校中華民國政府官職資料庫，提供黨政運作及重要職務人事調動之參考。
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="cloud-divider mb-6 sm:mb-12"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e8d4a0] to-[#d4af37] flex items-center justify-center">
                <Archive className="w-6 h-6 text-[#2c3e50]" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                跨時期收錄
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              涵蓋自興中會至中國國民黨第十四屆中央委員會的重要職名，完整呈現黨組織與人事演變脈絡。
            </p>
          </div>

          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                結構化檢索
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              提供人名、別名、組織單位、職務及任期等欄位檢索，並提供排序及篩選功能，提升查找效率。
            </p>
          </div>

          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#bdc3c7] to-[#7f8c8d] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                人名權威對照
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              參照國家圖書館NBINet人名權威查詢系統，建立人名與別名對照，提升人物檢索與資料查找效率。
            </p>
          </div>

          <div className="paper-card rounded-lg p-6 paper-card-hover ink-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c9a832] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium ink-text">
                智慧研究輔助
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              AI深度探索為自然語言詢答功能，可作為理解中國國民黨的組織發展及人事變遷脈絡之參考，並可選擇同步查詢中華民國政府官職資料庫，檢視黨組織與政府組織之間的人事流動。
            </p>
          </div>
        </div>

        {/* Usage Guide — 依 0530 修訂暫時隱藏（保留原內容以備還原）
        <div className="cloud-divider my-6 sm:my-12"></div>

        <div className="paper-card rounded-lg p-5 sm:p-8 seal-corner">
          <h3 className="text-xl sm:text-2xl mb-4 sm:mb-6 ink-text section-title">
            使用指引
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
        */}

        {/* Quick Links — 依 0530 修訂暫時隱藏（保留原內容以備還原）
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Link
            to="/history"
            className="paper-card rounded-lg p-6 paper-card-hover ink-border block"
          >
            <h4 className="text-lg font-medium ink-text mb-2 seal-left">
              組織沿革
            </h4>
            <p className="text-sm text-gray-600">
              瞭解中國國民黨自創建至今的重要歷史事件與組織變革
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
              立即開始中國國民黨職名錄與任期資料
            </p>
          </Link>
        </div>
        */}
      </div>
    </div>
  );
}