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
  "reply": "根據職名錄資料庫查詢結果，蔣中正曾擔任...",
  "sql_jsonl": "[{\"姓名\":\"蔣中正\",\"職位\":\"主席\",...}]",
  "intro_context": "第五屆中央執行委員會概述...",
  "sql_text": "SELECT * FROM ... WHERE 姓名 LIKE '%蔣中正%'",
  "gpdb_result": "（僅 ans_with_gpdb 模式有值）",
  "gpdb_params": "（僅 ans_with_gpdb 模式有值）"
}
```

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
