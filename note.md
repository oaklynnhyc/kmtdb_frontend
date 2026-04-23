React 檔案的運作順序

瀏覽器載入 index.html
      ↓
執行 main.tsx        ← 入口點，只執行一次
      ↓
掛載 <App />         ← 整個 app 的根
      ↓
App 建立 Router、Routes、各頁面
      ↓
URL 對應的頁面 component 被渲染
你的專案裡每個檔案的角色
1. main.tsx — 啟動器

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
找到 HTML 裡的 <div id="root">，把整個 React app 插進去。只跑一次，不再被其他 React 檔案 import。

2. App.tsx — 骨架
定義了整個 app 的結構：Router、認證保護、頁面路由。所有頁面都在這裡「登記」。


<BrowserRouter basename={basename}>      ← 唯一的 Router
  <AuthProvider>                         ← 把登入狀態傳給所有子元件
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>     ← 未登入就擋回 /login
        <Route element={<LayoutWithNav />}>    ← 加上導覽列
          <Route path="/" element={<HomePage />} />
          ...
3. contexts/auth-context.tsx — 共享狀態

// 任何子元件都可以這樣取得登入資訊：
const { isAuthenticated, user } = useAuth();
AuthProvider 包住所有子元件後，底下任何一層都能直接取得登入狀態，不需要一層一層用 props 傳。這是 React Context 的作用。

4. components/layout/navigation.tsx — 可重用元件
不負責資料，只負責畫出導覽列。用 useLocation() 知道目前在哪個頁面（用來 highlight 目前選項）。


import { Link, useLocation } from 'react-router-dom';
// Link 讓頁面跳轉不需要重新載入整個 HTML
5. 各頁面（pages/*.tsx）— 葉節點
每個頁面只負責自己的內容。需要路由資訊時用 hook：


// roster-detail.tsx
const { id } = useParams();          // 取得 URL 的 :id
// login-page.tsx
const navigate = useNavigate();       // 跳轉到其他頁面
資料怎麼在檔案間流動

App.tsx
  └─ AuthProvider (context)
       └─ LayoutWithNav
            ├─ Navigation        ← useAuth() 取登入資訊
            └─ <Outlet />        ← 目前路由對應的頁面
                 └─ RosterSearch ← useAuth(), fetch('/api/search/')
三種傳資料的方式：

方式	用途	例子
Props	父傳子	<Button label="搜尋" />
Context	跨層共享	useAuth() 取得登入狀態
API fetch	從後端取資料	fetch('/api/search/')
