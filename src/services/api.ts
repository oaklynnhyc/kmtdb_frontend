/**
 * API 服務層：封裝所有與 Django 後端的通訊。
 *
 * 完整 API 規格請參考 API_SPEC.md。
 *
 * 前台全站免登入（2026-08-05），無認證端點。
 * CSRF Token 從 cookie 讀取，放入 X-CSRFToken header；所有請求帶 credentials: 'include'。
 */

// ---------- 設定 ----------

// VITE_BASE_PATH: 地端為空（預設），iaic 機器設為 '/kmtdb'
const BASE = import.meta.env.VITE_BASE_PATH ?? '';

// ---------- 工具函式 ----------

function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return response.json();
}

// ========== CSRF ==========
// 前台已無登入。正式環境的 csrftoken 由 SPA 的 HTML 發出（Django 的 ensure_csrf_cookie），
// 但 npm run dev 時 HTML 由 Vite 提供、不經過 Django，需要主動打這支才拿得到 token，
// 否則 Chatbot 的所有 POST 都會被 CSRF 擋下。
export async function ensureCsrfCookie() {
  await fetch(`${BASE}/api/csrf/`, { credentials: 'include' });
}

// ========== 搜尋 API ==========
// 詳見 API_SPEC.md 第 2 節

export interface SearchParams {
  queryFields: string[];      // 中文欄位名，如 '全欄位', '姓名_別名'
  searchValues: string[];     // 搜尋值，與 queryFields 一一對應
  searchOperators: string[];  // 'and' | 'or' | 'not'
  startYears?: string[];
  startMonths?: string[];
  startDays?: string[];
  endYears?: string[];
  endMonths?: string[];
  endDays?: string[];
  dateOperators?: string[];
  // 有值／為空篩選條件
  isValueFields?: string[];     // Django 欄位名，如 '組織', '一級單位'
  isValues?: string[];          // '有值' | '為空'
  isValueOperators?: string[];  // 'and' | 'or' | 'not'
  page?: number;
  pageSize?: number;
  viewType?: 'list' | 'detail';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function searchRecords(params: SearchParams) {
  const urlParams = new URLSearchParams();

  // 文字搜尋條件
  params.queryFields.forEach(f => urlParams.append('Query_Field[]', f));
  params.searchValues.forEach(v => urlParams.append('search_value[]', v));
  params.searchOperators.forEach(o => urlParams.append('search_operator[]', o));

  // 日期搜尋條件
  // 後端依據 start_year 的長度做 for loop，各組陣列長度必須一致
  if (params.startYears) {
    params.startYears.forEach((y, i) => {
      urlParams.append('start_year', y);
      urlParams.append('start_month', params.startMonths?.[i] || '');
      urlParams.append('start_day', params.startDays?.[i] || '');
    });
  }
  if (params.endYears) {
    params.endYears.forEach((y, i) => {
      urlParams.append('end_year', y);
      urlParams.append('end_month', params.endMonths?.[i] || '');
      urlParams.append('end_day', params.endDays?.[i] || '');
    });
  }
  if (params.dateOperators) {
    params.dateOperators.forEach(o => urlParams.append('date_operator[]', o));
  }

  // 有值／為空篩選條件
  if (params.isValueFields) {
    params.isValueFields.forEach(f => urlParams.append('is_value_field[]', f));
    params.isValues?.forEach(v => urlParams.append('is_value[]', v));
    params.isValueOperators?.forEach(o => urlParams.append('is_value_operator[]', o));
  }

  // 分頁
  if (params.page) urlParams.set('page', String(params.page));
  if (params.pageSize) urlParams.set('page_size', String(params.pageSize));
  if (params.viewType) urlParams.set('view_type', params.viewType);

  return apiFetch<PaginatedResponse<Record<string, any>>>(`${BASE}/api/search/?${urlParams.toString()}`);
}

// ========== 單筆紀錄 API ==========
// 詳見 API_SPEC.md 第 2.2 節

export async function getRecord(id: number | string) {
  return apiFetch<Record<string, any>>(`${BASE}/api/records/${id}/`);
}

// ========== 組織沿革 API ==========

export interface Introduction {
  id: number;
  title: string;  // 屆次
  content: string;
}

export async function getIntroductions(): Promise<Introduction[]> {
  const response = await fetch(`${BASE}/api/introductions/`, { credentials: 'include' });
  if (!response.ok) throw new Error(`API Error ${response.status}`);
  return response.json();
}

// ========== 凡例 API ==========

export interface EditorialContentEntry {
  id: number;
  order: number;
  content: string;
}

export interface FieldNoteEntry {
  id: number;
  order: number;
  field: string;  // 欄位
  note: string;   // 說明
}

export async function getEditorialContent(): Promise<EditorialContentEntry[]> {
  const response = await fetch(`${BASE}/api/editorial-content/`, { credentials: 'include' });
  if (!response.ok) throw new Error(`API Error ${response.status}`);
  return response.json();
}

export async function getFieldNotes(): Promise<FieldNoteEntry[]> {
  const response = await fetch(`${BASE}/api/field-notes/`, { credentials: 'include' });
  if (!response.ok) throw new Error(`API Error ${response.status}`);
  return response.json();
}

// ========== 欄位顯示設定 API ==========

export interface ColumnConfig {
  column_name: string;   // DB 物理欄位名（KmttblColumnDisplay.column_name）
  field_name: string;    // Django ORM 欄位名 = API JSON key（如 '任用依據'）
  display_label: string; // 前端顯示標籤
  sort_order_list: number;
  sort_order_detail: number;
}

export interface ColumnsResponse {
  list: ColumnConfig[];
  detail: ColumnConfig[];
}

export async function getColumns() {
  return apiFetch<ColumnsResponse>(`${BASE}/api/columns/`);
}

// ========== 聊天機器人 API ==========
// 詳見 API_SPEC.md 第 3 節

export interface ChatResponse {
  brief_reply: string;   // 簡要回覆
  reply: string;         // 詳細回覆
  agent_steps: any[];
  rate_limited?: boolean;  // 達使用上限時為 true
  retry_after?: number;    // 還要等幾秒可再用（限流時）
  captcha_required?: boolean;  // 需先完成人機驗證
}

export async function chatbotQuery(message: string, answerType: string = 'ans_summary') {
  return apiFetch<ChatResponse>(`${BASE}/chatbot/query/`, {
    method: 'POST',
    body: JSON.stringify({ message, answer_type: answerType }),
  });
}

export async function chatbotClear() {
  return apiFetch<{ success: boolean }>(`${BASE}/chatbot/clear/`, { method: 'POST' });
}

export async function chatbotVerify(token: string) {
  return apiFetch<{ success: boolean }>(`${BASE}/chatbot/verify/`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
