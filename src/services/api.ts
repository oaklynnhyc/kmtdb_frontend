/**
 * API 服務層：封裝所有與 Django 後端的通訊。
 *
 * 完整 API 規格請參考 API_SPEC.md。
 *
 * 認證機制：
 * - 使用 Django SessionAuthentication
 * - CSRF Token 從 cookie 讀取，放入 X-CSRFToken header
 * - 所有請求帶 credentials: 'include'
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

  if (response.status === 401 || response.status === 403) {
    throw new AuthError('未登入或權限不足');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return response.json();
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// ========== 認證 API ==========
// 詳見 API_SPEC.md 第 1 節

export async function login(username: string, password: string) {
  return apiFetch<{ username: string; is_staff: boolean }>(`${BASE}/api/auth/login/`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function checkAuthStatus() {
  // 不使用 apiFetch：未登入時後端回 200 + {authenticated: false}
  // 若使用 apiFetch，萬一後端誤回 401 會導致 AuthProvider 初始化失敗
  const response = await fetch(`${BASE}/api/auth/status/`, { credentials: 'include' });
  return response.json() as Promise<{ authenticated: boolean; username: string | null }>;
}

export async function logout() {
  return apiFetch<{ success: boolean }>(`${BASE}/api/auth/logout/`, {
    method: 'POST',
  });
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

// ========== 欄位顯示設定 API ==========

export interface ColumnConfig {
  column_name: string;   // DB 物理欄位名（KmttblColumnDisplay.column_name）
  field_name: string;    // Django ORM 欄位名 = API JSON key（如 '起始日期來源_原因'）
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
