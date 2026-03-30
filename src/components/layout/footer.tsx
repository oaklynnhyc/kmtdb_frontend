import { ExternalLink } from 'lucide-react';

/**
 * Footer 外部連結說明：
 * 以下三個連結目前在 Figma Make 預覽環境中可能無法直接開啟外部網站。
 * 正式部署後，確認下方 href 為真實網址即可正常導向：
 *   - 政大圖書館：            https://www.lib.nccu.edu.tw/
 *   - 黨史檔案探索系統：      https://archiveds.lib.nccu.edu.tw/
 *   - 政府官職資料庫：        https://gpost.lib.nccu.edu.tw/
 */

const EXTERNAL_LINKS = [
  {
    label: '政大圖書館',
    sub: '國立政治大學圖書館',
    // ↓ TODO【正式部署】確認此網址正確
    href: 'https://www.lib.nccu.edu.tw/',
  },
  {
    label: '黨史檔案探索系統',
    sub: '中國國民黨黨史檔案',
    // ↓ TODO【正式部署】確認此網址正確
    href: 'https://archiveds.lib.nccu.edu.tw/',
  },
  {
    label: '政府官職資料庫',
    sub: '中華民國政府官職',
    // ↓ TODO【正式部署】確認此網址正確
    href: 'https://gpost.lib.nccu.edu.tw/',
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto">
      {/* 頂部分隔裝飾 */}
      <div
        style={{
          height: '1px',
          background:
            'linear-gradient(to right, transparent 0%, rgba(212,175,55,0.18) 20%, rgba(212,175,55,0.32) 50%, rgba(212,175,55,0.18) 80%, transparent 100%)',
        }}
      />

      {/* Footer 主體 */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #2c3e50 0%, #34495e 45%, #2c3e50 75%, #34495e 100%)',
        }}
      >
        {/* 背景光暈裝飾 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 900px 220px at 15% 80%, rgba(232,212,160,0.07) 0%, transparent 60%), ' +
              'radial-gradient(ellipse 700px 200px at 85% 20%, rgba(126,213,197,0.05) 0%, transparent 60%)',
          }}
        />

        {/* 頂端金色細線 */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: '2px',
            background:
              'linear-gradient(to right, transparent 0%, rgba(232,212,160,0.22) 15%, rgba(212,175,55,0.5) 50%, rgba(232,212,160,0.22) 85%, transparent 100%)',
            boxShadow: '0 1px 6px rgba(212,175,55,0.14)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* 主要內容列 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            {/* 左側：版權聲明 */}
            <div className="flex flex-col gap-1.5">
              <p
                className="text-sm tracking-wider"
                style={{ color: 'rgba(232,212,160,0.92)' }}
              >
                國民黨職名錄數位加值系統
              </p>
              <p
                className="text-xs"
                style={{ color: 'rgba(189,195,199,0.62)' }}
              >
                © {currentYear}&ensp;國立政治大學圖書館&ensp;·&ensp;典藏與學術研究使用
              </p>
              <p
                className="text-xs"
                style={{ color: 'rgba(189,195,199,0.4)' }}
              >
                本系統資料僅供學術研究參考，引用請依學術規範標注來源。
              </p>
            </div>

            {/* 右側：外部連結 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
              {/* 分隔線（桌面） */}
              <div
                className="hidden sm:block self-stretch w-px mx-6"
                style={{ background: 'rgba(212,175,55,0.16)' }}
              />

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {EXTERNAL_LINKS.map((link, index) => (
                  <FooterLink key={index} {...link} />
                ))}
              </div>
            </div>
          </div>

          {/* 底部細字分隔 */}
          <div
            className="mt-3 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
            style={{ borderTop: '1px solid rgba(189,195,199,0.1)' }}
          >
            <p
              className="text-xs"
              style={{ color: 'rgba(189,195,199,0.32)' }}
            >
              Digital Archive System · 1945–1990 Taiwan Political History
            </p>
            <p
              className="text-xs"
              style={{ color: 'rgba(189,195,199,0.28)' }}
            >
              National Chengchi University Library
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- 子元件：外部連結 ---------- */
function FooterLink({
  label,
  sub,
  href,
}: {
  label: string;
  sub: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="footer-ext-link group flex items-start gap-1.5 transition-all duration-200"
    >
      <div className="flex flex-col">
        <span
          className="footer-ext-label text-xs tracking-wide transition-colors duration-200"
          style={{ color: 'rgba(189,195,199,0.75)' }}
        >
          {label}
        </span>
        <span
          className="text-xs"
          style={{ color: 'rgba(189,195,199,0.38)' }}
        >
          {sub}
        </span>
      </div>
      <ExternalLink
        className="footer-ext-icon w-3 h-3 mt-0.5 flex-shrink-0 transition-colors duration-200"
        style={{ color: 'rgba(212,175,55,0.38)' }}
      />

      {/* Scoped hover styles for this link */}
      <style>{`
        .footer-ext-link:hover .footer-ext-label {
          color: rgba(232,212,160,0.95) !important;
        }
        .footer-ext-link:hover .footer-ext-icon {
          color: rgba(212,175,55,0.8) !important;
        }
      `}</style>
    </a>
  );
}
