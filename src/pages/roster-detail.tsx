import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, User, Loader2 } from 'lucide-react';
import { getRecord, getColumns, type ColumnConfig } from '@/services/api';
import { mapDjangoToRoster } from '@/services/field-mapping';
import type { RosterRecord } from '@/types/roster';
import { CardContent, CardHeader, CardTitle, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * 欄位分類：與 roster-search.tsx 的 fieldGroups / filterFieldGroups 保持一致。
 * key = Django 欄位的 field_name（與後端 JSON key 一致）。
 */
const FIELD_CATEGORY: Record<string, string> = {
  // 人物資訊
  '姓名': '人物資訊', '別名': '人物資訊', '前任姓名': '人物資訊', '後任姓名': '人物資訊',
  // 組織與職位
  '組織': '組織與職位', '一級單位': '組織與職位', '二級單位': '組織與職位',
  '三級單位': '組織與職位', '職位': '組織與職位', '屆次': '組織與職位',
  // 任期時間
  '起始日期': '任期時間', '結束日期': '任期時間',
  '任用依據': '任期時間', '離職依據': '任期時間',
  // 任用與異動
  '產生方式': '任用與異動', '兼_代': '任用與異動', '序位': '任用與異動',
  '離職原因': '任用與異動', '調_升任單位職稱': '任用與異動',
  // 其他
  '地點備註': '其他', '其他備註': '其他', '其他出處來源': '其他',
};

/** 分類顯示順序 */
const CATEGORY_ORDER = ['人物資訊', '組織與職位', '任期時間', '任用與異動', '其他'];

export function RosterDetail() {
  const { id } = useParams<{ id: string }>();
  const [rawRecord, setRawRecord] = useState<Record<string, any> | null>(null);
  const [record, setRecord] = useState<RosterRecord | null>(null);
  const [detailColumns, setDetailColumns] = useState<ColumnConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getColumns()
      .then(data => setDetailColumns(data.detail))
      .catch(err => setError(err.message || '載入欄位設定失敗'));
  }, []);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getRecord(Number(id))
      .then(data => {
        setRawRecord(data);
        setRecord(mapDjangoToRoster(data));
      })
      .catch(err => {
        setError(err.message || '載入資料失敗');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#16a085] mx-auto mb-4" />
          <p className="text-gray-600">載入資料中...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="paper-card rounded-lg max-w-md seal-corner">
          <div className="p-12 text-center">
            <h2 className="text-2xl mb-4 ink-text">查無資料</h2>
            <p className="text-gray-600 mb-6">
              {error || '您查詢的職名錄資料不存在'}
            </p>
            <Link to="/registry">
              <button className="ink-button px-6 py-2 rounded">返回職名錄檢索</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 詳目欄位列：一律顯示。實際資料用一般色；空值占位（— 或留白）用淡色，避免被誤認為內容
  const InfoRow = ({ label, value }: { label: string; value: string }) => {
    const isPlaceholder = value === '' || value === '—';
    return (
      <div className="border-b border-gray-100 pb-2">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className={`text-[15px] leading-relaxed ${isPlaceholder ? 'text-gray-300' : 'text-gray-700'}`}>
          {value || ' '}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="ink-header text-white py-8 sm:py-10 lg:py-12 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/registry">
            <button className="mb-3 sm:mb-4 text-white hover:text-gray-200 px-3 sm:px-4 py-2 rounded hover:bg-white/10 transition-colors flex items-center text-sm sm:text-base">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回職名錄檢索
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl mb-2">詳細資料</h1>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="paper-card rounded-lg seal-corner">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 seal-left">
                    <User className="w-5 h-5 text-[#16a085]" />
                    <h2 className="text-xl font-medium ink-text">{record.name}</h2>
                  </div>
                  {record.term && (
                    <span className="seal-badge">
                      {record.term}
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="space-y-0 p-4 sm:p-6">
                {/* 動態欄位：依分類群組顯示，分類順序與 search 頁一致 */}
                {(() => {
                  const cols = detailColumns;

                  // 將欄位依分類分組；所有欄位皆顯示。無資料時：
                  //   「其他」區塊留白，其餘比照簡目顯示「—」
                  const grouped: Record<string, { col: ColumnConfig; value: string }[]> = {};
                  for (const col of cols) {
                    const raw = rawRecord?.[col.field_name];
                    const isEmpty = raw === null || raw === undefined || raw === '';
                    const category = FIELD_CATEGORY[col.field_name] ?? '其他';
                    const value = isEmpty ? (category === '其他' ? '' : '—') : String(raw);
                    if (!grouped[category]) grouped[category] = [];
                    grouped[category].push({ col, value });
                  }

                  // 按 CATEGORY_ORDER 排序，未知分類排最後
                  const orderedCategories = CATEGORY_ORDER.filter(c => grouped[c]);
                  const extraCategories = Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c));

                  return [...orderedCategories, ...extraCategories].map((category, idx) => (
                    <div key={category}>
                      {idx > 0 && <Separator className="bg-neutral-100 my-4 sm:my-5" />}
                      <p className="text-xs font-medium text-gray-400 tracking-widest uppercase mb-3">
                        {category}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {grouped[category].map(({ col, value }) => (
                          <InfoRow key={col.field_name} label={col.display_label} value={value} />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </CardContent>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <FileText className="w-5 h-5" />
                  <span>資料摘要</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-neutral-50 rounded">
                    <p className="text-neutral-600 mb-1">人物</p>
                    <p className="font-medium text-neutral-800">{record.name}{record.alias ? ` (${record.alias})` : ''}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded">
                    <p className="text-neutral-600 mb-1">職位</p>
                    <p className="font-medium text-neutral-800">{record.position || '—'}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded">
                    <p className="text-neutral-600 mb-1">單位</p>
                    <p className="font-medium text-neutral-800">{record.unit3 || record.unit2 || record.unit1 || '原書未著錄'}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded">
                    <p className="text-neutral-600 mb-1">任期</p>
                    <p className="font-medium text-neutral-800">
                      {record.startDate || '不詳'} 至 {record.endDate || '不詳'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-base">引用格式</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-neutral-100 rounded text-xs font-mono break-words leading-relaxed">
                  〈{record.name}〉，收入「國立政治大學圖書館中國國民黨職名錄檢索系統」。{window.location.href}（{new Date().toLocaleDateString('zh-TW')}點閱）。
                </div>
                {/* 依 0601 修訂，引用格式下方淺灰說明文字隱藏（保留原內容以備還原）
                <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                  進行學術引用時，請使用上述格式並依學術規範調整。詳細引用說明請參考凡例頁面。
                </p>
                */}
              </CardContent>
            </Card>

            {/* 依 0601 修訂，「相關功能」區塊隱藏（保留原內容以備還原）
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-base">相關功能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link to="/registry">
                    <Button variant="outline" size="sm" className="w-full border-neutral-300">
                      返回檢索頁面
                    </Button>
                  </Link>
                  <Link to="/history">
                    <Button variant="outline" size="sm" className="w-full border-neutral-300">
                      查看組織沿革
                    </Button>
                  </Link>
                  <Link to="/editorial">
                    <Button variant="outline" size="sm" className="w-full border-neutral-300">
                      查看凡例說明
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
