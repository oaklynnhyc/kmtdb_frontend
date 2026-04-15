# 後端 API 串接規格書

> 本文件定義前端所有 API 呼叫的完整規格，供後端開發者實作對接。

---

## 通用規範

| 項目 | 說明 |
|------|------|
| 基礎路徑 | 同一 domain（Django 與前端同源部署） |
| 認證方式 | Django `SessionAuthentication` + CSRF Token |
| CSRF Token | 前端從 `document.cookie` 讀取 `csrftoken`，放入 `X-CSRFToken` header |
| Cookie 策略 | 所有請求帶 `credentials: 'include'` |
| 回應格式 | JSON |
| 錯誤處理 | 401/403 → 前端跳轉登入頁面 |

### CSRF 設定要求

Django settings 必須設定：
```python
CSRF_COOKIE_HTTPONLY = False   # 前端需要用 JS 讀取 cookie
```

SPA 入口 view 與登入相關 view 都需加上 `@ensure_csrf_cookie` 裝飾器，確保第一次載入時就設定 CSRF cookie。

---

## 1. 認證 API

### 1.1 登入

```
POST /api/auth/login/
```

**權限：** AllowAny

**Request Body：**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200：**
```json
{
  "username": "string",
  "is_staff": true
}
```

**Response 401：**
```json
{
  "error": "帳號或密碼錯誤"
}
```

---

### 1.2 認證狀態

```
GET /api/auth/status/
```

**權限：** AllowAny（重要！不可回 401）

**Response 200（已登入）：**
```json
{
  "authenticated": true,
  "username": "string"
}
```

**Response 200（未登入）：**
```json
{
  "authenticated": false,
  "username": null
}
```

 **注意：** 此端點無論登入與否都必須回 200。前端 `AuthProvider` 在首次載入時呼叫此端點檢查狀態。若回 401，會導致前端初始化失敗。

---

### 1.3 登出

```
POST /api/auth/logout/
```

**權限：** IsAuthenticated

**Response 200：**
```json
{
  "success": true
}
```

---

## 2. 搜尋 API

### 2.1 名冊搜尋

```
GET /api/search/
```

**權限：** IsAuthenticated

**Query Parameters：**

| 參數 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `Query_Field[]` | string[] | 搜尋欄位（中文） | `全欄位`, `姓名_別名`, `職位`, `一級單位` |
| `search_value[]` | string[] | 搜尋值（與 Query_Field 一一對應） | `孫中山` |
| `search_operator[]` | string[] | 邏輯運算子 | `and`, `or`, `not` |
| `start_year` | string[] | 起始年份 | `1924` |
| `start_month` | string[] | 起始月份 | `01` |
| `start_day` | string[] | 起始日 | `01` |
| `end_year` | string[] | 結束年份 | `1926` |
| `end_month` | string[] | 結束月份 | `12` |
| `end_day` | string[] | 結束日 | `31` |
| `date_operator[]` | string[] | 日期邏輯運算子 | `and` |
| `page` | number | 頁碼（從 1 開始） | `1` |
| `page_size` | number | 每頁筆數 | `50` |
| `view_type` | string | 顯示模式 | `list` 或 `detail` |

**可用的 Query_Field 值：**

| Query_Field | 對應資料庫欄位 |
|-------------|----------------|
| `全欄位` | 搜尋所有文字欄位 |
| `姓名_別名` | 姓名 + 別名 |
| `前任姓名` | 前任姓名 |
| `後任姓名` | 後任姓名 |
| `一級單位` | 一級單位 |
| `二級單位` | 二級單位 |
| `三級單位` | 三級單位 |
| `職位` | 職位 |
| `屆次` | 屆次 |
| `起始日期` | 起始日期 |
| `結束日期` | 結束日期 |
| `起始日期來源_原因` | 起始日期來源/原因 |
| `結束日期來源_原因` | 結束日期來源/原因 |
| `產生方式` | 產生方式 |
| `兼_代` | 兼/代 |
| `序位` | 序位 |
| `離職原因` | 離職原因 |
| `調_升任單位職稱` | 調/升任單位職稱 |
| `會議地點` | 會議地點 |
| `其他備註` | 其他備註 |
| `其他出處來源` | 其他出處來源 |

**Response 200（分頁格式）：**
```json
{
  "count": 1234,
  "next": "http://example.com/api/search/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "姓名": "孫中山",
      "別名": "孫文",
      "前任姓名": "",
      "後任姓名": "蔣中正",
      "組織": "中國國民黨",
      "一級單位": "中央執行委員會",
      "二級單位": "",
      "三級單位": "",
      "職位": "總理",
      "屆次": "第一屆",
      "起始日期": "1924-01-30",
      "結束日期": "1925-03-12",
      "起始日期來源_原因": "第一次全國代表大會選出",
      "結束日期來源_原因": "逝世",
      "產生方式": "選舉",
      "兼_代": "",
      "序位": 1,
      "離職原因": "逝世",
      "調_升任單位職稱": "",
      "會議地點": "廣州",
      "其他備註": "",
      "其他出處來源": ""
    }
  ]
}
```

> **注意：** 後端回傳欄位名為**中文**。前端使用 `field-mapping.ts` 的 `mapDjangoToRoster()` 函式將中文欄位名轉換為英文介面。
>
> **後端必須回傳 `組織` 欄位：** 前端搜尋結果列表會顯示「組織」欄。`組織` 與 `一級單位` 為不同欄位，`組織` 為甲編各時期組織名稱或乙編之「中國國民黨」，`一級單位` 為本部/委員會層級。若後端資料庫中 `組織` 為獨立欄位，請確保在搜尋結果中回傳。

---

### 2.2 單筆紀錄

```
GET /api/records/{id}/
```

**權限：** IsAuthenticated

**Response 200：**
```json
{
  "id": 1,
  "姓名": "孫中山",
  "別名": "孫文",
  ...（同搜尋結果的單筆格式）
}
```

**Response 404：**
```json
{
  "error": "Record not found"
}
```

---

## 3. 聊天機器人 API

### 3.1 查詢

```
POST /chatbot/query/
```

**權限：** IsAuthenticated（透過 Session）

**Request Body：**
```json
{
  "message": "蔣中正擔任過哪些職務？",
  "answer_type": "ans_summary"
}
```

**answer_type 可選值：**

| 值 | 說明 |
|----|------|
| `ans_summary` | 統整式回答：僅查詢職名錄資料庫，回答速度較快 |
| `ans_with_gpdb` | 整合官職資料庫回答：額外查詢政府官職系統資料庫，提供更完整佐證 |

**Response 200：**
```json
{
  "reply_summary": "蔣中正曾擔任中央執行委員會主席、總裁等職務，橫跨第三屆至第七屆。",
  "reply_detail": "根據職名錄資料庫查詢結果，蔣中正曾擔任以下職務：\n\n一、中央執行委員會主席（第三屆～第六屆，1929-1949）...\n二、總裁（第六屆起，1938-1975）...\n\n以上資料來源涵蓋職名錄資料庫中共 42 筆相關紀錄...",
  "reply": "（向下相容欄位，內容同 reply_summary。待前端全面切換後可移除）",
  "sql_jsonl": "[{\"姓名\":\"蔣中正\",\"職位\":\"主席\",...}]",
  "intro_context": "第五屆中央執行委員會概述...",
  "sql_text": "SELECT * FROM ... WHERE 姓名 LIKE '%蔣中正%'",
  "gpdb_result": "（僅 ans_with_gpdb 模式有值）",
  "gpdb_params": "（僅 ans_with_gpdb 模式有值）"
}
```

**回覆欄位說明：**

| 欄位 | 說明 |
|------|------|
| `reply_summary` | **簡要回覆**：前端預設顯示，簡短摘要（建議 1-3 句） |
| `reply_detail` | **詳細回覆**：使用者點擊「查看詳細回覆」後展開顯示，包含完整分析與佐證資料 |
| `reply` | 向下相容欄位，內容同 `reply_summary`。待前端全面切換至 `reply_summary` 後可移除 |

> **前端行為：** 預設顯示 `reply_summary`，下方出現「查看詳細回覆」按鈕。使用者點擊後展開 `reply_detail` 內容。再次點擊可收合。

### 3.2 前端模擬模式（Mock）說明

目前後端 API 尚未就緒，前端內建了一套模擬機制讓 UI 可以獨立運行預覽。**後端串接完成後需移除。**

#### 運作原理

前端透過環境變數 `VITE_API_READY` 控制是否使用模擬資料：

```
VITE_API_READY 未設定或為空 → 模擬模式（預設）
VITE_API_READY=true          → 呼叫真實後端 API
```

模擬模式下，使用者送出訊息後：
1. 不會發出任何 HTTP 請求
2. 等待 0.8～1.4 秒模擬後端延遲
3. 從前端寫死的 `MOCK_REPLIES` 查找對應回覆（常見問題有專屬回覆，其餘問題使用通用模板）
4. 回傳的訊息包含 `content`（簡要）與 `detailedContent`（詳細），以及模擬的查詢詳情

#### 相關程式碼位置

| 檔案 | 位置 | 內容 | 串接後處理 |
|------|------|------|-----------|
| `src/pages/chat-bot.tsx` | `MOCK_REPLIES` 常數（約第 34～98 行） | 5 組常見問題的模擬回覆資料 | **刪除整個常數** |
| `src/pages/chat-bot.tsx` | `handleSend()` 內 `// ── MOCK START` 至 `// ── MOCK END` 區塊 | 模擬模式判斷與假資料組裝邏輯 | **刪除整個區塊**（保留其下方的 `try/catch`） |
| `src/services/api.ts` | `ChatResponse` 介面（約第 146～155 行） | 已包含 `reply_summary` 與 `reply_detail` 欄位定義 | **不需修改**，正式邏輯已寫好 |

#### 切換至真實 API 的步驟

1. **確認後端 API 已就緒**（`POST /chatbot/query/` 回傳含 `reply_summary` + `reply_detail`）
2. **快速驗證**：在專案根目錄建立 `.env` 檔案，加入一行：
   ```
   VITE_API_READY=true
   ```
   重新啟動 `npm run dev`，此時前端會直接呼叫後端 API
3. **確認穩定後清理**：刪除以下內容（搜尋 `MOCK` 關鍵字即可快速定位）：
   - `chat-bot.tsx` 中的 `MOCK_REPLIES` 常數
   - `chat-bot.tsx` 中 `handleSend()` 內 `MOCK START` ～ `MOCK END` 之間的整個 `if (useMock) { ... }` 區塊
   - `chat-bot.tsx` 頂部的 `VITE_API_READY` 相關 TODO 註解
4. 如不需要 `.env` 中的 `VITE_API_READY` 變數，一併刪除

> **注意：** `handleSend()` 中 `MOCK END` 之後的 `try/catch` 區塊是正式的 API 呼叫邏輯，已使用 `data.reply_summary ?? data.reply` 做向下相容處理，**請勿刪除**。

---

## 4. Django URL 配置參考

```python
# kmtdb/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),          # REST API
    path('chatbot/', include('kmtgp_si.urls')), # 聊天機器人
    # SPA catch-all（需放最後）
    re_path(r'^(?!admin|api|chatbot|static).*', SPAView.as_view()),
]
```

```python
# api/urls.py
urlpatterns = [
    path('auth/login/', LoginAPIView.as_view()),
    path('auth/status/', AuthStatusAPIView.as_view()),
    path('auth/logout/', LogoutAPIView.as_view()),
    path('search/', SearchAPIView.as_view()),
    path('records/<int:pk>/', RecordDetailAPIView.as_view()),
]
```

---

## 5. 前端欄位映射對照表

前端使用英文欄位名，後端使用中文欄位名。映射關係定義在 `src/services/field-mapping.ts`。

| 後端欄位（中文） | 前端欄位（英文） | 類型 |
|-----------------|-----------------|------|
| `id` / `peopleid` | `id` | string |
| `姓名` | `name` | string |
| `組織` | `organization` | string? | ← **搜尋結果列表顯示欄位** |
| `別名` | `alias` | string? |
| `前任姓名` | `previousName` | string? |
| `後任姓名` | `nextName` | string? |
| `一級單位` | `unit1` | string? |
| `二級單位` | `unit2` | string? |
| `三級單位` | `unit3` | string? |
| `職位` | `position` | string? |
| `屆次` | `term` | string? |
| `起始日期` | `startDate` | string? |
| `結束日期` | `endDate` | string? |
| `起始日期來源_原因` | `startDateSource` | string? |
| `結束日期來源_原因` | `endDateSource` | string? |
| `產生方式` | `appointmentMethod` | string? |
| `兼_代` | `concurrent` | string? |
| `序位` | `order` | number? |
| `離職原因` | `resignationReason` | string? |
| `調_升任單位職稱` | `transferPosition` | string? |
| `會議地點` | `meetingLocation` | string? |
| `其他備註` | `notes` | string? |
| `其他出處來源` | `otherSources` | string? |
