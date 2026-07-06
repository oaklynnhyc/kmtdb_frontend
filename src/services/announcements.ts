/**
 * 公告（最新消息）資料服務。
 *
 * 已串接後端 API（api app）：
 *   GET /api/announcements/       → 在架公告列表（置頂優先、上架日新→舊）
 *   GET /api/announcements/{id}/  → 單筆公告（非在架回 404）
 * 後端 model 欄位：title／content／publish_date（=前端 date）／unpublish_date／is_pinned，
 * 由管理者於 Django admin 維護並設定上架／下架日期。
 */

// VITE_BASE_PATH: 地端為空（預設），iaic/pdbcomp 機器設為 '/kmtdb'
const BASE = import.meta.env.VITE_BASE_PATH ?? '';

/** 前端使用的公告型別（駝峰命名） */
export interface Announcement {
  id: number;
  title: string;       // 公告標題
  date: string;        // 公告日期（YYYY-MM-DD）；對應後端 publish_date
  content: string;     // 公告內文（純文字，可含換行 \n）
  isPinned: boolean;   // 是否置頂
}

/** 後端 API 回傳格式（is_pinned 為蛇底命名） */
interface AnnouncementApi {
  id: number;
  title: string;
  date: string;
  content: string;
  is_pinned: boolean;
}

/** 首頁公告區塊最多顯示的則數 */
export const HOME_ANNOUNCEMENT_LIMIT = 5;

function fromApi(a: AnnouncementApi): Announcement {
  return { id: a.id, title: a.title, date: a.date, content: a.content, isPinned: a.is_pinned };
}

/** 置頂優先、其次依日期新→舊（後端已排序，前端再保險排一次） */
function sortAnnouncements(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}

/** 取得在架公告列表（置頂優先、日期新→舊） */
export async function getAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${BASE}/api/announcements/`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  const data: AnnouncementApi[] = await res.json();
  return sortAnnouncements(data.map(fromApi));
}

/** 取得單筆公告；查無或已下架（404）回傳 null */
export async function getAnnouncement(id: string | number): Promise<Announcement | null> {
  const res = await fetch(`${BASE}/api/announcements/${id}/`, { credentials: 'include' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return fromApi(await res.json());
}
