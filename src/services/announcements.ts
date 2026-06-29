/**
 * 公告（最新消息）資料服務。
 *
 * ⚠️ 目前為「前端模擬資料」。後端 API／資料庫由另一位開發者接手，接手方式見
 *    本檔末端的「後端接手須知」與各函式上方的 TODO[後端接手] 註記。
 */

export interface Announcement {
  id: string;
  title: string;       // 公告標題
  date: string;        // 公告日期（YYYY-MM-DD）；對應後端「上架日期」
  content: string;     // 公告內文（純文字，可含換行 \n）
  isPinned: boolean;   // 是否置頂
}

/** 首頁公告區塊最多顯示的則數 */
export const HOME_ANNOUNCEMENT_LIMIT = 5;

/** 模擬資料（6 筆；含 2 筆置頂、日期新→舊不一），之後由後端 API 取代 */
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a-2026-0628-maint',
    title: '【系統維護】6/30(二) 22:00–7/1(三) 02:00 暫停服務公告',
    date: '2026-06-28',
    isPinned: true,
    content:
      '為提升系統穩定性與檢索效能，本檢索系統將於下列時間進行例行維護，期間將暫停所有檢索與 AI 深度探索服務：\n\n' +
      '維護時間：2026 年 6 月 30 日（星期二）22:00 起，至 7 月 1 日（星期三）02:00 止。\n\n' +
      '維護期間造成不便，敬請見諒。如有緊急需求，請於維護結束後再行操作。',
  },
  {
    id: 'a-2026-0620-data',
    title: '【資料增補】第十四屆中央委員會職名資料更新',
    date: '2026-06-20',
    isPinned: true,
    content:
      '本次更新依據 2014 年中華書局修訂出版之《中國國民黨職名錄(1894-1994)》，增補第十四屆中央委員會相關職名與任免資料，並校訂部分人名與單位名稱。\n\n' +
      '歡迎研究者多加利用，如發現資料疑義，敬請來信指正。',
  },
  {
    id: 'a-2026-0615-feature',
    title: 'AI 深度探索新增官職資料庫整合查詢',
    date: '2026-06-15',
    isPinned: false,
    content:
      'AI 深度探索功能新增「官職資料庫」模式，可於回答時同步查詢中華民國政府官職資料庫，協助檢視黨組織與政府組織之間的人事流動。\n\n' +
      '請於研究助理頁面右下角的模式選單切換使用。',
  },
  {
    id: 'a-2026-0610-cite',
    title: '詳細資料頁引用格式調整通知',
    date: '2026-06-10',
    isPinned: false,
    content:
      '為符合學術引用規範，詳細資料頁之引用格式已調整，並自動帶入人名、系統網址與點閱日期。詳細引用說明請參閱凡例頁面。',
  },
  {
    id: 'a-2026-0605-editorial',
    title: '凡例說明頁面欄位著錄說明更新',
    date: '2026-06-05',
    isPinned: false,
    content:
      '凡例說明頁面之「各欄位著錄說明」已依最新編輯體例更新，並補充各欄位之著錄範例，方便使用者理解檢索欄位意義。',
  },
  {
    id: 'a-2026-0530-launch',
    title: '中國國民黨職名錄檢索系統正式上線',
    date: '2026-05-30',
    isPinned: false,
    content:
      '本檢索系統正式對外開放。系統收錄自興中會至中國國民黨第十四屆中央委員會之重要職名，提供結構化檢索、組織沿革、凡例說明與 AI 深度探索等功能。\n\n' +
      '敬邀各界研究者多加利用。',
  },
];

/** 置頂優先，其次依日期新→舊排序 */
function sortAnnouncements(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}

/**
 * 取得公告列表（已排序：置頂優先、日期新→舊）。
 *
 * TODO[後端接手]: 改為呼叫後端 API，例如：
 *   return apiFetch<Announcement[]>(`${BASE}/api/announcements/`);
 * 後端只回傳「目前在架」的公告（上架日期 <= 今日 <= 下架日期）。
 * 排序可由後端處理；若後端未排序，前端的 sortAnnouncements 仍可保留。
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  await new Promise((r) => setTimeout(r, 150)); // 模擬網路延遲
  return sortAnnouncements(MOCK_ANNOUNCEMENTS);
}

/**
 * 取得單筆公告。
 *
 * TODO[後端接手]: 改為呼叫後端 API，例如：
 *   return apiFetch<Announcement>(`${BASE}/api/announcements/${id}/`);
 * 查無資料（或已下架）時回傳 null。
 */
export async function getAnnouncement(id: string): Promise<Announcement | null> {
  await new Promise((r) => setTimeout(r, 100));
  return MOCK_ANNOUNCEMENTS.find((a) => a.id === id) ?? null;
}

/*
 * ───────────────────────────── 後端接手須知 ─────────────────────────────
 * 1. 資料模型（建議欄位）：
 *      - title        標題（CharField）
 *      - content      內文（TextField，純文字、可含換行）
 *      - publish_date 上架日期（DateField）→ 對應前端 Announcement.date
 *      - unpublish_date 下架日期（DateField，可空 = 永久）
 *      - is_pinned    是否置頂（BooleanField）
 *      - created_at / updated_at（自動）
 *    管理者於 Django 後台填寫標題、內文，並設定上架／下架日期。
 *
 * 2. 「在架」判定：publish_date <= 今日 <= (unpublish_date 或無限)。
 *    僅回傳在架公告。
 *
 * 3. API（建議）：
 *      GET /api/announcements/       → 在架公告列表（JSON 陣列；欄位見 Announcement 介面）
 *      GET /api/announcements/{id}/  → 單筆公告（查無或已下架回 404 / null）
 *    回傳欄位請對齊本檔 Announcement 介面：{ id, title, date, content, is_pinned }。
 *    （前端若採 is_pinned 蛇底命名，於此檔 map 成 isPinned 即可。）
 *
 * 4. 串接點：只需改 getAnnouncements / getAnnouncement 兩個函式的實作（改打 API），
 *    其餘前端（首頁區塊、列表頁、詳細頁）皆吃這兩個函式，無需更動。
 *    api.ts 已有 apiFetch 與 BASE 可直接複用。
 * ────────────────────────────────────────────────────────────────────────
 */
