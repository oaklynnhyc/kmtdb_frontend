import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Briefcase, FileText, User, Building2, Loader2 } from 'lucide-react';
import { getRecord } from '@/services/api';
import { mapDjangoToRoster } from '@/services/field-mapping';
import type { RosterRecord } from '@/types/roster';
import { CardContent, CardHeader, CardTitle, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function RosterDetail() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<RosterRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getRecord(Number(id))
      .then(data => {
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
      <div className="ink-header text-white py-12 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/registry">
            <button className="mb-4 text-white hover:text-gray-200 px-4 py-2 rounded hover:bg-white/10 transition-colors flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回名冊檢索
            </button>
          </Link>
          <h1 className="text-3xl mb-2">職名錄詳細資料</h1>
          <p className="text-gray-200">ID: {record.id}</p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="paper-card rounded-lg seal-corner">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
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
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-base mb-4">人物資訊</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="姓名" value={record.name} icon={User} />
                    <InfoRow label="別名" value={record.alias} />
                    <InfoRow label="前任姓名" value={record.previousName} />
                    <InfoRow label="後任姓名" value={record.nextName} />
                  </div>
                </div>

                <Separator className="bg-neutral-200" />

                {/* Organization and Position */}
                <div>
                  <h3 className="text-base mb-4">組織與職位</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="一級單位" value={record.unit1} icon={Building2} />
                    <InfoRow label="二級單位" value={record.unit2} icon={Building2} />
                    <InfoRow label="三級單位" value={record.unit3} icon={Building2} />
                    <InfoRow label="職位" value={record.position} icon={Briefcase} />
                    <InfoRow label="屆次" value={record.term} />
                    <InfoRow label="序位" value={record.order} />
                  </div>
                </div>

                <Separator className="bg-neutral-200" />

                {/* Term Information */}
                <div>
                  <h3 className="text-base mb-4">任期時間</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="起始日期" value={record.startDate} icon={Calendar} />
                    <InfoRow label="結束日期" value={record.endDate} icon={Calendar} />
                    <InfoRow label="起始日期來源／原因" value={record.startDateSource} />
                    <InfoRow label="結束日期來源／原因" value={record.endDateSource} />
                  </div>
                </div>

                <Separator className="bg-neutral-200" />

                {/* Appointment Information */}
                <div>
                  <h3 className="text-base mb-4">任用與異動</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="產生方式" value={record.appointmentMethod} />
                    <InfoRow label="兼／代" value={record.concurrent} />
                    <InfoRow label="離職原因" value={record.resignationReason} />
                    <InfoRow label="調／升任單位職稱" value={record.transferPosition} />
                  </div>
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
