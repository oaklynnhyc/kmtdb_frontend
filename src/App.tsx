import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { LoginPage } from '@/pages/login-page';
import { HomePage } from '@/pages/home-page';
import { RosterSearch } from '@/pages/roster-search';
import { RosterDetail } from '@/pages/roster-detail';
import { OrganizationalHistory } from '@/pages/organizational-history';
import { EditorialNotes } from '@/pages/editorial-notes';
import { RecordDetail } from '@/pages/record-detail';
import { ChatBot } from '@/pages/chat-bot';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen ink-wash-bg flex items-center justify-center">
        <div className="paper-card rounded-lg p-12 text-center seal-corner">
          <div className="animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[#d4af37]/30 mx-auto mb-4" />
            <p className="ink-text">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function LayoutWithNav() {
  return (
    <>
      {/*
        Navigation 置於 ink-wash-bg 之外：
        ink-design.css 的 ".ink-wash-bg > *" 規則會強制子元素 position: relative，
        會覆蓋 sticky，導致導覽列隨頁面捲動。
      */}
      <Navigation />
      <div className="min-h-screen ink-wash-bg flex flex-col pt-16">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 公開路由 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 受保護路由 */}
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutWithNav />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<OrganizationalHistory />} />
              <Route path="/editorial" element={<EditorialNotes />} />
              <Route path="/registry" element={<RosterSearch />} />
              <Route path="/roster/:id" element={<RosterDetail />} />
              <Route path="/record/:id" element={<RecordDetail />} />
              <Route path="/chat" element={<ChatBot />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
