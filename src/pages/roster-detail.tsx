import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, FileText, User, Loader2 } from 'lucide-react';
import { getRecord, getColumns, type ColumnConfig } from '@/services/api';
import { mapDjangoToRoster } from '@/services/field-mapping';
import type { RosterRecord } from '@/types/roster';
import { CardContent, CardHeader, CardTitle, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const DEFAULT_DETAIL_COLUMNS: ColumnConfig[] = [
  { column_name: '組織',           field_name: '組織',           display_label: '組織',           sort_order_list: 1,  sort_order_detail: 1  },
  { column_name: '一級單位',        field_name: '一級單位',        display_label: '一級單位',        sort_order_list: 2,  sort_order_detail: 2  },
  { column_name: '二級單位',        field_name: '二級單位',        display_label: '二級單位',        sort_order_list: 3,  sort_order_detail: 3  },
  { column_name: '三級單位',        field_name: '三級單位',        display_label: '三級單位',        sort_order_list: 4,  sort_order_detail: 4  },
  { column_name: '職位',           field_name: '職位',           display_label: '職位',           sort_order_list: 5,  sort_order_detail: 5  },
  { column_name: '屆次',           field_name: '屆次',           display_label: '屆次',           sort_order_list: 6,  sort_order_detail: 6  },
  { column_name: '起始日期',        field_name: '起始日期',        display_label: '起始日期',        sort_order_list: 7,  sort_order_detail: 7  },
  { column_name: '結束日期',        field_name: '結束日期',        display_label: '結束日期',        sort_order_list: 8,  sort_order_detail: 8  },
  { column_name: '起始日期來源／原因', field_name: '起始日期來源_原因', display_label: '起始日期來源／原因', sort_order_list: 9,  sort_order_detail: 9  },
  { column_name: '結束日期來源／原因', field_name: '結束日期來源_原因', display_label: '結束日期來源／原因', sort_order_list: 10, sort_order_detail: 10 },
  { column_name: '產生方式',        field_name: '產生方式',        display_label: '產生方式',        sort_order_list: 11, sort_order_detail: 11 },
  { column_name: '兼／代',         field_name: '兼_代',          display_label: '兼／代',         sort_order_list: 12, sort_order_detail: 12 },
  { column_name: '序位',           field_name: '序位',           display_label: '序位',           sort_order_list: 13, sort_order_detail: 13 },
  { column_name: '離職原因',        field_name: '離職原因',        display_label: '離職原因',        sort_order_list: 14, sort_order_detail: 14 },
  { column_name: '調／升任單位職稱',  field_name: '調_升任單位職稱',  display_label: '調／升任單位職稱',  sort_order_list: 15, sort_order_detail: 15 },
  { column_name: '前任姓名',        field_name: '前任姓名',        display_label: '前任姓名',        sort_order_list: 16, sort_order_detail: 16 },
  { column_name: '後任姓名',        field_name: '後任姓名',        display_label: '後任姓名',        sort_order_list: 17, sort_order_detail: 17 },
  { column_name: '會議地點',        field_name: '會議地點',        display_label: '會議地點',        sort_order_list: 18, sort_order_detail: 18 },
  { column_name: '其他備註',        field_name: '其他備註',        display_label: '其他備註',        sort_order_list: 19, sort_order_detail: 19 },
  { column_name: '其他出處來源',     field_name: '其他出處來源',     display_label: '其他出處來源',     sort_order_list: 20, sort_order_detail: 20 },
];

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
      .catch(() => {});
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
              <button className="ink-button px-6 py-2 rounded">返回名冊檢索</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value?: string | number; icon?: any }) => {
    if (!value && value !== 0) return null;
    return (
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <p className="text-base text-gray-700">{value}</p>
        </div>
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
              返回名冊檢索
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl mb-2">職名錄詳細資料</h1>
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
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* 動態欄位：由 KmttblColumnDisplay 控制，讀不到時 fallback 到 DEFAULT_DETAIL_COLUMNS
                    rawRecord = 後端原始 JSON（中文 key），field_name 與後端 key 一致 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {(detailColumns.length > 0 ? detailColumns : DEFAULT_DETAIL_COLUMNS).map(col => {
                    const value = rawRecord?.[col.field_name];
                    if (value === null || value === undefined || value === '') return null;
                    return <InfoRow key={col.field_name} label={col.display_label} value={String(value)} />;
                  })}
                </div>

                <Separator className="bg-neutral-200" />

                {/* Historical Records */}
                <div>
                  <h3 className="text-base mb-4">史料與備註</h3>
                  <div className="space-y-3">
                    <InfoRow label="會議地點" value={record.meetingLocation} icon={MapPin} />
                    {record.notes && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">其他備註</p>
                        <p className="text-neutral-700 leading-relaxed text-sm">{record.notes}</p>
                      </div>
                    )}
                    <InfoRow label="其他出處來源" value={record.otherSources} />
                  </div>
                </div>
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
                    <p className="font-medium text-neutral-800">{record.unit1 || '—'}</p>
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
                  國民黨職名錄數位加值系統，〈{record.name}〉，{record.position || '職位不詳'}，{record.startDate || '起始不詳'}至{record.endDate || '結束不詳'}，檢索日期：{new Date().toLocaleDateString('zh-TW')}。
                </div>
                <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                  進行學術引用時，請使用上述格式並依學術規範調整。詳細引用說明請參考凡例頁面。
                </p>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
    </div>
  );
}
