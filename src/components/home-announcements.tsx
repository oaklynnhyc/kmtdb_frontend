import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Pin, ChevronRight } from 'lucide-react';
import { getAnnouncements, HOME_ANNOUNCEMENT_LIMIT, type Announcement } from '@/services/announcements';

/** 首頁「最新消息」公告區塊：置頂優先、日期新→舊，最多顯示 HOME_ANNOUNCEMENT_LIMIT 則 */
export function HomeAnnouncements() {
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let alive = true;
    getAnnouncements()
      .then((data) => { if (alive) setItems(data); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  const shown = items?.slice(0, HOME_ANNOUNCEMENT_LIMIT) ?? [];
  const hasMore = (items?.length ?? 0) > HOME_ANNOUNCEMENT_LIMIT;

  // 沒有公告（或載入中／載入失敗）時，整個區塊與分隔線都不顯示
  if (shown.length === 0) return null;

  return (
    <>
      <div className="paper-card rounded-lg p-5 sm:p-8 seal-corner">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl ink-text section-title">
            最新消息
          </h2>
          {hasMore && (
            <Link to="/announcements"
              className="text-sm text-gray-500 hover:text-[#16a085] transition-colors flex items-center gap-0.5 flex-shrink-0">
              更多內容 <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <ul className="divide-y divide-gray-100">
          {shown.map((a) => (
            <li key={a.id}>
              <Link to={`/announcements/${a.id}`}
                className="group flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3">
                <span className="text-xs sm:text-sm text-gray-400 font-mono shrink-0 sm:w-24 sm:pt-0.5">
                  {a.date}
                </span>
                <span className="flex-1 flex items-start gap-2">
                  {a.isPinned && (
                    <span className="shrink-0 mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-[#96852a] bg-[var(--gold)]/10 px-1.5 py-0.5 rounded">
                      <Pin className="w-3 h-3" />置頂
                    </span>
                  )}
                  <span className="ink-text group-hover:text-[#16a085] transition-colors leading-relaxed">
                    {a.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 自帶分隔線（與下方「關於本檢索系統」區隔；無公告時整個區塊不顯示，分隔線也不會出現）*/}
      <div className="cloud-divider my-6 sm:my-12"></div>
    </>
  );
}
