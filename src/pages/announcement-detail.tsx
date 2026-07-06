import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, Pin, Loader2 } from 'lucide-react';
import { getAnnouncement, type Announcement } from '@/services/announcements';

/** 公告詳細頁（/announcements/:id）：顯示完整內文，並提供返回首頁／返回列表 */
export function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    getAnnouncement(id)
      .then((data) => { if (alive) setItem(data); })
      .catch(() => { if (alive) setItem(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="min-h-screen">
      <div className="ink-header text-white py-8 sm:py-10 lg:py-12 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {loading ? (
          <div className="paper-card rounded-lg seal-corner p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#16a085] animate-spin" />
            <p className="text-sm text-gray-500">載入中…</p>
          </div>
        ) : !item ? (
          <div className="paper-card rounded-lg seal-corner p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-base ink-text">找不到這則公告</p>
            <p className="mt-2 text-sm text-gray-500">公告可能已下架或網址有誤。</p>
            <Link to="/announcements">
              <button className="ink-button px-6 py-2 rounded mt-6">前往最新消息列表</button>
            </Link>
          </div>
        ) : (
          <article className="paper-card rounded-lg seal-corner p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-sm text-gray-400 font-mono">{item.date}</span>
              {item.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-[#96852a] bg-[var(--gold)]/10 px-1.5 py-0.5 rounded">
                  <Pin className="w-3 h-3" />置頂
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-medium ink-text mb-5 seal-left leading-relaxed">
              {item.title}
            </h2>
            <div className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-line">
              {item.content}
            </div>

            <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap gap-3">
              <Link to="/">
                <button className="ink-button px-6 py-2 rounded flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />返回首頁
                </button>
              </Link>
              <Link to="/announcements">
                <button className="px-6 py-2 rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors">
                  返回最新消息列表
                </button>
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
