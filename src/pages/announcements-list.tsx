import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Megaphone, Pin } from 'lucide-react';
import { getAnnouncements, type Announcement } from '@/services/announcements';

/** 公告列表頁（/announcements）：顯示全部在架公告，置頂優先、日期新→舊 */
export function AnnouncementsList() {
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let alive = true;
    getAnnouncements()
      .then((data) => { if (alive) setItems(data); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="ink-header text-white py-8 sm:py-10 lg:py-12 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <button className="mb-3 sm:mb-4 text-white hover:text-gray-200 px-3 sm:px-4 py-2 rounded hover:bg-white/10 transition-colors flex items-center text-sm sm:text-base">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl mb-2 flex items-center gap-2">
            <Megaphone className="w-6 h-6 sm:w-7 sm:h-7" />
            最新消息
          </h1>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="paper-card rounded-lg seal-corner p-4 sm:p-6">
          {items === null ? (
            <p className="py-10 text-center text-sm text-gray-400">載入中…</p>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-base ink-text">目前沒有公告</p>
              <p className="mt-2 text-sm">最新消息將於此處公布</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((a) => (
                <li key={a.id}>
                  <Link to={`/announcements/${a.id}`}
                    className="group flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3.5">
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
          )}
        </div>
      </div>
    </div>
  );
}
