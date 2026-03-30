# KMT 國民黨職名錄數位加值系統 — 前端

React + TypeScript + Vite SPA 前端，搭配 Django 後端使用。

---

## 目錄結構

```
kmtdb-frontend-clean/
├── index.html                     # HTML 入口
├── package.json                   # 依賴管理（已精簡至實際使用項目）
├── vite.config.ts                 # Vite 建構設定 + Django 整合插件
├── tsconfig.json                  # TypeScript 設定
├── API_SPEC.md                    # 後端 API 串接規格書（交接用）
├── README.md                      # 本文件
└── src/
    ├── main.tsx                   # React 入口
    ├── App.tsx                    # 路由 + 版面配置 + 權限控制
    │
    ├── types/
    │   └── roster.ts              # RosterRecord 資料型別定義
    │
    ├── services/
    │   ├── api.ts                 # 所有 API 呼叫（認證/搜尋/聊天）
    │   └── field-mapping.ts       # Django 中文欄位 ↔ React 英文欄位 映射
    │
    ├── contexts/
    │   └── auth-context.tsx       # 登入狀態 Context (login/logout/isAuthenticated)
    │
    ├── styles/
    │   ├── index.css              # 樣式入口（匯入以下各檔）
    │   ├── tailwind.css           # Tailwind CSS 指令
    │   ├── theme.css              # CSS 變數主題（shadcn/ui 相容）
    │   └── ink-design.css         # 自訂設計系統
    │
    ├── components/
    │   ├── layout/
    │   │   ├── navigation.tsx     # 頂部導覽列
    │   │   └── footer.tsx         # 頁腳
    │   └── ui/                    # 僅保留實際使用的 UI 元件
    │       ├── utils.ts           # cn() 工具函式
    │       ├── input.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── tabs.tsx
    │       ├── select.tsx
    │       ├── badge.tsx
    │       ├── separator.tsx
    │       └── scroll-area.tsx
    │
    └── pages/
        ├── login-page.tsx         # 登入頁面
        ├── home-page.tsx          # 首頁（功能導覽）
        ├── roster-search.tsx      # 名冊檢索（快速/進階搜尋 + 分頁結果）
        ├── roster-detail.tsx      # 單筆職名錄詳細資料
        ├── record-detail.tsx      # 黨員資料（開發中佔位頁）
        ├── chat-bot.tsx           # 研究助理（AI 問答）
        ├── organizational-history.tsx  # 組織沿革
        └── editorial-notes.tsx    # 凡例說明
```

---

## 技術棧

| 項目 | 版本 |
|------|------|
| React | 18 |
| TypeScript | 5 |
| Vite | 6 |
| Tailwind CSS | 4 |
| React Router | 7 |
| Radix UI | 各元件獨立版本 |
| Lucide React | 圖示庫 |

---

## 開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（需先啟動 Django 後端 localhost:8000）
npm run dev

# 建構生產版本（輸出至 ../static/spa/）
npm run build
```

### 開發模式代理

Vite 開發伺服器會將 `/api` 和 `/chatbot` 請求代理到 `http://localhost:8000`（Django）。

---

## 與 Django 整合

### 建構流程

1. `npm run build` 將 JS/CSS 輸出至 `../static/spa/`
2. Vite 插件自動將 `index.html` 複製至 `../templates/spa/index.html`，並注入 `{% load static %}`
3. Django 透過 `SPAView`（TemplateView）渲染 `spa/index.html`
4. SPA catch-all URL 讓前端路由接管

### Django 端需要的設定

1. **settings.py** — 加入 `api` 和 `spa` 到 `INSTALLED_APPS`，設定 `CSRF_COOKIE_HTTPONLY = False`
2. **urls.py** — 加入 API 路由和 SPA catch-all 路由
3. **.gitignore** — 排除 `static/spa/` 建構產物

詳見 `API_SPEC.md` 的第 4 節。

---

## 路由表

| 路徑 | 頁面 | 權限 |
|------|------|------|
| `/login` | 登入 | 公開 |
| `/` | 首頁 | 需登入 |
| `/history` | 組織沿革 | 需登入 |
| `/editorial` | 凡例 | 需登入 |
| `/registry` | 名冊檢索 | 需登入 |
| `/roster/:id` | 職名錄詳細 | 需登入 |
| `/record/:id` | 黨員資料 | 需登入 |
| `/chat` | 研究助理 | 需登入 |

---

## 設計系統

統一視覺風格，以 CSS 自訂類別實作（`ink-design.css`）：

- `.ink-wash-bg` — 背景
- `.ink-header` — 墨色漸層頭部
- `.paper-card` — 分欄卡片
- `.ink-button` / `.gold-button` — 主題按鈕
- `.seal-corner` — 角落裝飾
- `.seal-left` — 左側青玉裝飾線
- `.ink-table` — 表格
- `.brush-title` — 筆觸標題裝飾
- `.cloud-divider` — 雲紋分隔線
