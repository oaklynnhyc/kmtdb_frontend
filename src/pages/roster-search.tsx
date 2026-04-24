import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, X, Search as SearchIcon, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchRecords, type PaginatedResponse } from '@/services/api';
import { mapDjangoToRoster, toDjangoSearchField, toDjangoOperator } from '@/services/field-mapping';
import type { RosterRecord } from '@/types/roster';

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicOperator: 'AND' | 'OR' | 'NOT';
}

const fieldGroups = {
  人物資訊: [
    { value: 'name', label: '姓名／別名' },
    { value: 'previousName', label: '前任姓名' },
    { value: 'nextName', label: '後任姓名' },
  ],
  組織與職位: [
    { value: 'unit1', label: '一級單位' },
    { value: 'unit2', label: '二級單位' },
    { value: 'unit3', label: '三級單位' },
    { value: 'position', label: '職位' },
    { value: 'term', label: '屆次' },
  ],
  任期時間: [
    { value: 'startDate', label: '起始日期' },
    { value: 'endDate', label: '結束日期' },
    { value: 'startDateSource', label: '起始日期來源／原因' },
    { value: 'endDateSource', label: '結束日期來源／原因' },
  ],
  任用與異動: [
    { value: 'appointmentMethod', label: '產生方式' },
    { value: 'concurrent', label: '兼／代' },
    { value: 'order', label: '序位' },
    { value: 'resignationReason', label: '離職原因' },
    { value: 'transferPosition', label: '調／升任單位職稱' },
  ],
  史料與備註: [
    { value: 'meetingLocation', label: '會議地點' },
    { value: 'notes', label: '其他備註' },
    { value: 'otherSources', label: '其他出處來源' },
  ],
};

const STORAGE_KEY = 'rosterSearchState';

function loadStoredState(): any {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function RosterSearch() {
  const stored = loadStoredState();

  const [quickSearchTab, setQuickSearchTab] = useState<string>(stored?.quickSearchTab ?? 'all');
  const [allFieldsQuery, setAllFieldsQuery] = useState<string>(stored?.allFieldsQuery ?? '');
  const [nameQuery, setNameQuery] = useState<string>(stored?.nameQuery ?? '');
  const [positionQuery, setPositionQuery] = useState<string>(stored?.positionQuery ?? '');
  const [timeStartYear, setTimeStartYear] = useState<string>(stored?.timeStartYear ?? '');
  const [timeEndYear, setTimeEndYear] = useState<string>(stored?.timeEndYear ?? '');

  const [showAdvanced, setShowAdvanced] = useState<boolean>(stored?.showAdvanced ?? false);
  const [advancedConditions, setAdvancedConditions] = useState<QueryCondition[]>(
    stored?.advancedConditions ?? [
      { id: 'default-1', field: 'name', operator: 'contains', value: '', logicOperator: 'AND' },
    ]
  );

  // API 狀態
  const [results, setResults] = useState<RosterRecord[]>(stored?.results ?? []);
  const [totalCount, setTotalCount] = useState<number>(stored?.totalCount ?? 0);
  const [currentPage, setCurrentPage] = useState<number>(stored?.currentPage ?? 1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState<boolean>(stored?.hasSearched ?? false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        quickSearchTab, allFieldsQuery, nameQuery, positionQuery,
        timeStartYear, timeEndYear, showAdvanced, advancedConditions,
        results, totalCount, currentPage, hasSearched,
      }));
    } catch {}
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, timeStartYear,
      timeEndYear, showAdvanced, advancedConditions, results, totalCount,
      currentPage, hasSearched]);

  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  const addCondition = () => {
    setAdvancedConditions([...advancedConditions, {
      id: Date.now().toString(),
      field: 'name',
      operator: 'contains',
      value: '',
      logicOperator: 'AND',
    }]);
  };

  const removeCondition = (id: string) => {
    setAdvancedConditions(advancedConditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setAdvancedConditions(
      advancedConditions.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const performSearch = useCallback(async (page: number = 1) => {
    // 建構搜尋參數
    const queryFields: string[] = [];
    const searchValues: string[] = [];
    const searchOperators: string[] = [];

    // 快速搜尋
    if (quickSearchTab === 'all' && allFieldsQuery.trim()) {
      queryFields.push('全欄位');
      searchValues.push(allFieldsQuery.trim());
      searchOperators.push('and');
    } else if (quickSearchTab === 'person' && nameQuery.trim()) {
      queryFields.push('姓名_別名');
      searchValues.push(nameQuery.trim());
      searchOperators.push('and');
    } else if (quickSearchTab === 'position' && positionQuery.trim()) {
      queryFields.push('職位');
      searchValues.push(positionQuery.trim());
      searchOperators.push('and');
    }

    // 進階搜尋條件
    advancedConditions.forEach(c => {
      if (c.value.trim()) {
        queryFields.push(toDjangoSearchField(c.field));
        searchValues.push(c.value.trim());
        searchOperators.push(toDjangoOperator(c.logicOperator));
      }
    });

    // 如果沒有任何搜尋條件（且不是時間搜尋），不發 API
    const hasTextSearch = queryFields.length > 0;
    const hasTimeSearch = quickSearchTab === 'time' && (timeStartYear || timeEndYear);

    if (!hasTextSearch && !hasTimeSearch) {
      setError('請至少輸入一個搜尋條件');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await searchRecords({
        queryFields: hasTextSearch ? queryFields : ['全欄位'],
        searchValues: hasTextSearch ? searchValues : [''],
        searchOperators: hasTextSearch ? searchOperators : ['and'],
        startYears: hasTimeSearch ? [timeStartYear ? timeStartYear.slice(0, 4) : ''] : undefined,
        endYears: hasTimeSearch ? [timeEndYear ? timeEndYear.slice(0, 4) : ''] : undefined,
        dateOperators: hasTimeSearch ? ['and'] : undefined,
        page,
        pageSize,
      });

      const mapped = data.results.map(mapDjangoToRoster);
      setResults(mapped);
      setTotalCount(data.count);
      setCurrentPage(page);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || '搜尋失敗');
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, timeStartYear, timeEndYear, advancedConditions]);

  const handleSearch = () => performSearch(1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (quickSearchTab === 'all' && allFieldsQuery) filters.push(`全欄位：${allFieldsQuery}`);
    if (quickSearchTab === 'person' && nameQuery) filters.push(`人物姓名：${nameQuery}`);
    if (quickSearchTab === 'position' && positionQuery) filters.push(`職位：${positionQuery}`);
    if (quickSearchTab === 'time' && (timeStartYear || timeEndYear)) {
      filters.push(`任職時間：${timeStartYear || '不限'}–${timeEndYear || '不限'}`);
    }
    advancedConditions.forEach((c, index) => {
      if (c.value) {
        const field = Object.values(fieldGroups).flat().find(f => f.value === c.field);
        const prefix = index > 0 ? ` ${c.logicOperator} ` : '';
        filters.push(`${prefix}${field?.label}：${c.value}`);
      }
    });
    return filters;
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, timeStartYear, timeEndYear, advancedConditions]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="ink-header text-white py-16 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl mb-3 brush-title">名冊檢索</h1>
          <p className="text-gray-200 text-lg">
            查詢國民黨黨務職名錄與任期資料，支援多條件組合查詢
          </p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Search */}
        <div className="paper-card rounded-lg mb-6 seal-corner p-6">
          <h3 className="text-lg font-medium mb-4 ink-text seal-left">快速查詢</h3>
          <div>
            <Tabs value={quickSearchTab} onValueChange={setQuickSearchTab} className="w-full">
              <div className="ink-tabs">
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { key: 'all', label: '全欄位' },
                    { key: 'person', label: '人物姓名' },
                    { key: 'position', label: '職位' },
                    { key: 'time', label: '時間' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setQuickSearchTab(tab.key)}
                      className="ink-tab px-4 py-2 rounded text-sm font-medium"
                      data-state={quickSearchTab === tab.key ? 'active' : 'inactive'}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <TabsContent value="all" className="mt-4">
                <p className="text-sm text-gray-600 mb-2">以關鍵字對資料庫進行查詢</p>
                <Input placeholder="例如：孫中山 興中會 文化工作會" value={allFieldsQuery}
                  onChange={e => setAllFieldsQuery(e.target.value)} onKeyDown={handleKeyDown} className="paper-input" />
              </TabsContent>
              <TabsContent value="person" className="mt-4">
                <p className="text-sm text-gray-600 mb-2">輸入人物姓名或別名進行查詢</p>
                <Input placeholder="例如：孫中山" value={nameQuery}
                  onChange={e => setNameQuery(e.target.value)} onKeyDown={handleKeyDown} className="paper-input" />
              </TabsContent>
              <TabsContent value="position" className="mt-4">
                <p className="text-sm text-gray-600 mb-2">輸入職位名稱進行查詢</p>
                <Input placeholder="例如：主席 部長 委員" value={positionQuery}
                  onChange={e => setPositionQuery(e.target.value)} onKeyDown={handleKeyDown} className="paper-input" />
              </TabsContent>
              <TabsContent value="time" className="mt-4">
                <p className="text-sm text-gray-600 mb-2">選擇任職時間範圍進行查詢</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm ink-text mb-2 font-medium">起始日期</label>
                    <div className="date-input-wrapper">
                      <Input type="date" value={timeStartYear}
                        onChange={e => setTimeStartYear(e.target.value)} onKeyDown={handleKeyDown} className="paper-input" />
                      <Calendar className="date-input-icon w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm ink-text mb-2 font-medium">結束日期</label>
                    <div className="date-input-wrapper">
                      <Input type="date" value={timeEndYear}
                        onChange={e => setTimeEndYear(e.target.value)} onKeyDown={handleKeyDown} className="paper-input" />
                      <Calendar className="date-input-icon w-4 h-4" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* 搜尋按鈕 */}
            <div className="mt-4 flex justify-end">
              <button onClick={handleSearch} disabled={isLoading}
                className="ink-button px-8 py-2 rounded flex items-center space-x-2 disabled:opacity-50">
                <SearchIcon className="w-4 h-4" />
                <span>{isLoading ? '搜尋中...' : '搜尋'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Search */}
        <div className="paper-card rounded-lg mb-6 ink-border">
          <CardHeader>
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-left">
              <CardTitle className="text-base">進階查詢</CardTitle>
              {showAdvanced ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
            </button>
          </CardHeader>
          {showAdvanced && (
            <CardContent>
              <div className="space-y-4">
                {advancedConditions.map((condition, index) => (
                  <div key={condition.id} className="flex items-start gap-3 pb-4 border-b border-neutral-200 last:border-0">
                    {index > 0 ? (
                      <Select value={condition.logicOperator}
                        onValueChange={value => updateCondition(condition.id, { logicOperator: value as 'AND' | 'OR' | 'NOT' })}>
                        <SelectTrigger className="w-32 border-neutral-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">且 (AND)</SelectItem>
                          <SelectItem value="OR">或 (OR)</SelectItem>
                          <SelectItem value="NOT">非 (NOT)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <div className="w-32" />}

                    <Select value={condition.field}
                      onValueChange={value => {
                        const prevIsDate = condition.field === 'startDate' || condition.field === 'endDate';
                        const nextIsDate = value === 'startDate' || value === 'endDate';
                        updateCondition(condition.id, {
                          field: value,
                          ...(prevIsDate !== nextIsDate ? { value: '' } : {}),
                        });
                      }}>
                      <SelectTrigger className="w-64 border-neutral-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(fieldGroups).map(([groupName, fields]) => (
                          <div key={groupName}>
                            <div className="px-2 py-1.5 text-xs font-medium text-neutral-500">{groupName}</div>
                            {fields.map(field => (
                              <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>

                    {condition.field === 'startDate' || condition.field === 'endDate' ? (
                      <div className="date-input-wrapper flex-1">
                        <Input type="date" value={condition.value}
                          onChange={e => updateCondition(condition.id, { value: e.target.value })}
                          onKeyDown={handleKeyDown} className="border-neutral-300" />
                        <Calendar className="date-input-icon w-4 h-4" />
                      </div>
                    ) : (
                      <Input placeholder="輸入查詢內容" value={condition.value}
                        onChange={e => updateCondition(condition.id, { value: e.target.value })}
                        onKeyDown={handleKeyDown} className="flex-1 border-neutral-300" />
                    )}

                    <Button variant="ghost" size="sm" onClick={() => removeCondition(condition.id)}
                      className="text-neutral-600 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addCondition} variant="outline" size="sm" className="border-neutral-300 text-neutral-700">
                  <Plus className="w-4 h-4 mr-2" />新增查詢條件
                </Button>
              </div>
            </CardContent>
          )}
        </div>

        {/* Query Summary */}
        {activeFilters.length > 0 && (
          <div className="mb-4 p-4 query-ink-box rounded text-sm">
            <div className="font-medium ink-text mb-2">查詢條件摘要：</div>
            <div className="ink-text">{activeFilters.join(' ')}</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results Header */}
        {hasSearched && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm ink-text">
              共 {totalCount} 筆資料{totalPages > 1 ? `，第 ${currentPage} / ${totalPages} 頁` : ''}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="paper-card rounded-lg p-12 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            </div>
            <p className="text-gray-500 mt-4">搜尋中...</p>
          </div>
        )}

        {/* Results Table */}
        {!isLoading && hasSearched && (
          <div className="paper-card rounded-lg overflow-hidden ink-scrollbar">
            <div className="overflow-x-auto">
              <table className="w-full text-sm ink-table">
                <thead>
                  <tr>
                    <th className="sticky left-0 px-4 py-3 text-left font-medium border-r border-gray-600/30 bg-[#34495e]">序號</th>
                    <th className="sticky left-16 px-4 py-3 text-left font-medium border-r border-gray-600/30 bg-[#34495e]">姓名</th>
                    <th className="px-4 py-3 text-left font-medium">組織</th>
                    <th className="px-4 py-3 text-left font-medium">一級單位</th>
                    <th className="px-4 py-3 text-left font-medium">二級單位</th>
                    <th className="px-4 py-3 text-left font-medium">三級單位</th>
                    <th className="px-4 py-3 text-left font-medium">職位</th>
                    <th className="px-4 py-3 text-left font-medium">屆次</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((record, index) => (
                    <tr key={record.id}>
                      <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200 font-mono text-xs text-gray-600">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="sticky left-16 bg-white px-4 py-3 border-r border-gray-200 font-medium ink-text">
                        <Link to={`/roster/${record.id}`} className="hover:text-[#16a085] hover:underline transition-colors">
                          {record.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{record.organization || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{record.unit1 || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{record.unit2 || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{record.unit3 || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{record.position || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{record.term || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-base ink-text">查無符合條件的資料</p>
                <p className="mt-2 text-sm">請嘗試調整查詢條件</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                <Button variant="outline" size="sm" disabled={currentPage <= 1}
                  onClick={() => performSearch(currentPage - 1)} className="border-neutral-300">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm ink-text px-4">
                  第 {currentPage} / {totalPages} 頁
                </span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                  onClick={() => performSearch(currentPage + 1)} className="border-neutral-300">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Initial state - no search yet */}
        {!isLoading && !hasSearched && (
          <div className="paper-card rounded-lg p-12 text-center">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              aria-label="搜尋"
              className="block mx-auto mb-4 text-gray-300 hover:text-[#16a085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <SearchIcon className="w-16 h-16" />
            </button>
            <p className="text-base ink-text">請輸入查詢條件並點擊搜尋</p>
            <p className="mt-2 text-sm text-gray-500">支援全欄位、姓名、職位、時間範圍等多種搜尋方式</p>
          </div>
        )}
      </div>
    </div>
  );
}
