import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, Landmark } from "lucide-react";
import { getIntroductions } from "@/services/api";

interface IntroEntry {
  title: string;
  era: string;
  years: string;
  category: "pre-party" | "executive" | "committee" | "special";
}

// 甲編：改組前各時期
const sectionA: IntroEntry[] = [
  {
    title: "興中會",
    era: "1894–1905",
    years: "清光緒二十年–三十一年",
    category: "pre-party",
  },
  {
    title: "中國同盟會",
    era: "1905–1912",
    years: "清光緒三十一年–民國元年",
    category: "pre-party",
  },
  {
    title: "國民黨",
    era: "1912–1913",
    years: "民國元年–二年",
    category: "pre-party",
  },
  {
    title: "中華革命黨",
    era: "1914–1919",
    years: "民國三年–八年",
    category: "pre-party",
  },
  {
    title: "中國國民黨（改組前）",
    era: "1919–1924",
    years: "民國八年–十三年",
    category: "pre-party",
  },
];

// 乙編：改組後各屆
const sectionB: IntroEntry[] = [
  {
    title: "第一屆中央執行、監察委員會",
    era: "1924–1926",
    years: "民國十三年–十五年",
    category: "executive",
  },
  {
    title: "第二屆中央執行、監察委員會",
    era: "1926–1929",
    years: "民國十五年–十八年",
    category: "executive",
  },
  {
    title: "上海中央執行委員會",
    era: "1925–1927",
    years: "民國十四年–十六年",
    category: "pre-party",
  },
  {
    title: "第三屆中央執行、監察委員會",
    era: "1929–1931",
    years: "民國十八年–二十年",
    category: "executive",
  },
  {
    title: "第四屆中央執行、監察委員會",
    era: "1931–1935",
    years: "民國二十年–二十四年",
    category: "executive",
  },
  {
    title: "第五屆中央執行、監察委員會",
    era: "1935–1945",
    years: "民國二十四年–三十四年",
    category: "executive",
  },
  {
    title: "第六屆中央執行、監察委員會",
    era: "1945–1952",
    years: "民國三十四年–四十一年",
    category: "executive",
  },
  {
    title: "三民主義青年團",
    era: "1938–1947",
    years: "民國二十七年–三十六年",
    category: "special",
  },
  {
    title: "中央改造委員會",
    era: "1950–1952",
    years: "民國三十九年–四十一年",
    category: "special",
  },
  {
    title: "第七屆中央委員會",
    era: "1952–1957",
    years: "民國四十一年–四十六年",
    category: "committee",
  },
  {
    title: "第八屆中央委員會",
    era: "1957–1963",
    years: "民國四十六年–五十二年",
    category: "committee",
  },
  {
    title: "第九屆中央委員會",
    era: "1963–1969",
    years: "民國五十二年–五十八年",
    category: "committee",
  },
  {
    title: "第十屆中央委員會",
    era: "1969–1976",
    years: "民國五十八年–六十五年",
    category: "committee",
  },
  {
    title: "第十一屆中央委員會",
    era: "1976–1981",
    years: "民國六十五年–七十年",
    category: "committee",
  },
  {
    title: "第十二屆中央委員會",
    era: "1981–1988",
    years: "民國七十年–七十七年",
    category: "committee",
  },
  {
    title: "第十三屆中央委員會",
    era: "1988–1993",
    years: "民國七十七年–八十二年",
    category: "committee",
  },
  {
    title: "第十四屆中央委員會",
    era: "1993–1997",
    years: "民國八十二年–民國八十六年",
    category: "committee",
  },
];

export function OrganizationalHistory() {
  const [expandAll, setExpandAll] = useState(false);
  const [contentOverrides, setContentOverrides] = useState<Map<string, string[]>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIntroductions()
      .then((data) => {
        const overrides = new Map<string, string[]>();
        data.forEach(({ title, content }) => {
          const paragraphs = content.split(/\r?\n\r?\n/).filter(Boolean);
          overrides.set(title, paragraphs);
        });
        setContentOverrides(overrides);
      })
      .catch((err) => setError(err.message || "載入沿革內容失敗"));
  }, []);

  const handleExpandAll = () => {
    setExpandAll(!expandAll);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="ink-header text-white py-10 sm:py-14 lg:py-16 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 brush-title">組織沿革</h1>
          <p className="text-gray-200 text-sm sm:text-base lg:text-lg">
            中國國民黨各時期組織概述
          </p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {error && (
          <div className="paper-card rounded-lg p-4 mb-6 text-sm text-red-700">
            沿革內容載入失敗（{error}），請稍後重新整理或聯絡管理者。
          </div>
        )}

        {/* Section A: 甲編 */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 seal-left">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <BookOpen className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-medium ink-text truncate">
                甲編　改組前各時期
              </h2>
              <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">1894–1924</span>
            </div>
            <button
              onClick={handleExpandAll}
              className="sm:ml-auto text-sm ink-button text-white px-4 py-1.5 rounded transition-colors self-start sm:self-auto flex-shrink-0"
            >
              {expandAll ? "全部收合" : "全部展開"}
            </button>
          </div>
          <div className="space-y-4">
            {sectionA.map((entry) => (
              <ExpandableEntry
                key={entry.title}
                entry={entry}
                forceExpand={expandAll}
                contentOverride={contentOverrides.get(entry.title)}
              />
            ))}
          </div>
        </section>

        {/* Section B: 乙編 */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 seal-left">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Landmark className="w-5 h-5 text-[#16a085] flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-medium ink-text truncate">
                乙編　改組後各屆中央委員會
              </h2>
              <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">1924–1997</span>
            </div>
          </div>
          <div className="space-y-4">
            {sectionB.map((entry) => (
              <ExpandableEntry
                key={entry.title}
                entry={entry}
                forceExpand={expandAll}
                contentOverride={contentOverrides.get(entry.title)}
              />
            ))}
          </div>
        </section>

        {/* 分隔線（與首頁一致） */}
        <div className="cloud-divider my-6 sm:my-12"></div>

        {/* Footer note */}
        <div className="paper-card rounded-lg p-4 sm:p-6 seal-corner">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            <strong className="ink-text">說明：</strong>
            本頁面資料依據《中國國民黨職名錄》（劉維開編輯，臺北市：中國國民黨黨史會，1994）各時期概述整理。更詳細的黨務人事與職位變動資訊，請參考「職名錄檢索」功能。
          </p>
        </div>
      </div>
    </div>
  );
}

function ExpandableEntry({
  entry,
  forceExpand,
  contentOverride,
}: {
  entry: IntroEntry;
  forceExpand: boolean;
  contentOverride?: string[];
}) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = forceExpand || localExpanded;
  const content = contentOverride ?? [];
  const preview = content[0] ?? "伺服器連線異常，請稍後重新整理或聯絡管理者。";

  return (
    <div className="paper-card rounded-lg paper-card-hover ink-border overflow-hidden">
      <button
        onClick={() => setLocalExpanded(!localExpanded)}
        className="w-full text-left p-5 sm:p-6 flex items-start gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-lg font-medium ink-text">{entry.title}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="font-medium">{entry.era}</span>
            <span className="text-gray-400">|</span>
            <span>{entry.years}</span>
          </div>
          {!expanded && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {preview}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 mt-1 text-gray-400">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100">
          <div className="pt-4 space-y-4 text-gray-700 leading-relaxed text-[15px]">
            {content.length > 0 ? (
              content.map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <p className="text-gray-400">伺服器連線異常，請稍後重新整理或聯絡管理者。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
