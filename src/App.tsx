import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { HomePage } from '@/pages/home-page';
import { RosterSearch } from '@/pages/roster-search';
import { RosterDetail } from '@/pages/roster-detail';
import { OrganizationalHistory } from '@/pages/organizational-history';
import { EditorialNotes } from '@/pages/editorial-notes';
import { RecordDetail } from '@/pages/record-detail';
import { ChatBot } from '@/pages/chat-bot';
import { AnnouncementsList } from '@/pages/announcements-list';
import { AnnouncementDetail } from '@/pages/announcement-detail';
import { ensureCsrfCookie } from '@/services/api';

function LayoutWithNav() {
  return (
    <>
      {/*
        Navigation 置於 ink-wash-bg 之外：
        ink-design.css 的 ".ink-wash-bg > *" 規則會強制子元素 position: relative，
        會覆蓋 sticky，導致導覽列隨頁面捲動。
      */}
      <Navigation />
      <div className="min-h-screen ink-wash-bg flex flex-col pt-14 sm:pt-16">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  const basename = import.meta.env.VITE_BASE_PATH ?? '';

  // 正式環境的 csrftoken 隨 SPA 的 HTML 一起發；npm run dev 時 HTML 由 Vite 提供，
  // 需要主動取一次，否則 Chatbot 的 POST 會被 CSRF 擋下。
  useEffect(() => {
    ensureCsrfCookie().catch(() => {});
  }, []);

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<LayoutWithNav />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<OrganizationalHistory />} />
          <Route path="/editorial" element={<EditorialNotes />} />
          <Route path="/announcements" element={<AnnouncementsList />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail />} />
          <Route path="/registry" element={<RosterSearch />} />
          <Route path="/roster/:id" element={<RosterDetail />} />
          <Route path="/record/:id" element={<RecordDetail />} />
          <Route path="/chat" element={<ChatBot />} />
        </Route>

        {/* Fallback：含舊的 /login，一律導回首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
