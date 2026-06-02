import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronsUpDown, Plus, X, Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateInput } from '@/components/ui/date-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchRecords, getColumns, type PaginatedResponse, type ColumnConfig } from '@/services/api';
// mapDjangoToRoster / RosterRecord 不再用於搜尋結果（改為原始資料 + 動態欄位），roster-detail.tsx 仍使用
import { toDjangoSearchField, toDjangoOperator } from '@/services/field-mapping';

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicOperator: 'AND' | 'OR' | 'NOT';
}

interface FilterCondition {
  id: string;
  field: string;                     // Django 欄位名（中文），直接送後端
  valueStatus: '有值' | '為空';
  logicOperator: 'AND' | 'OR' | 'NOT';
}

const fieldGroups = {
  人物資訊: [
    { value: 'name', label: '姓名／別名' },
    { value: 'previousName', label: '前任姓名' },
    { value: 'nextName', label: '後任姓名' },
  ],
  組織與職位: [
    { value: 'organization', label: '組織' },
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
  其他: [
    { value: 'meetingLocation', label: '地點' },
    { value: 'notes', label: '其他備註' },
    { value: 'otherSources', label: '其他出處來源' },
  ],
};

/** 篩選條件（有值／為空）專用欄位：value 為 Django model 欄位名，直接送後端 */
const filterFieldGroups = {
  人物資訊: [
    { value: '姓名', label: '姓名' },
    { value: '別名', label: '別名' },
    { value: '前任姓名', label: '前任姓名' },
    { value: '後任姓名', label: '後任姓名' },
  ],
  組織與職位: [
    { value: '組織', label: '組織' },
    { value: '一級單位', label: '一級單位' },
    { value: '二級單位', label: '二級單位' },
    { value: '三級單位', label: '三級單位' },
    { value: '職位', label: '職位' },
    { value: '屆次', label: '屆次' },
  ],
  任期時間: [
    { value: '起始日期來源_原因', label: '起始日期來源／原因' },
    { value: '結束日期來源_原因', label: '結束日期來源／原因' },
  ],
  任用與異動: [
    { value: '產生方式', label: '產生方式' },
    { value: '兼_代', label: '兼／代' },
    { value: '序位', label: '序位' },
    { value: '離職原因', label: '離職原因' },
    { value: '調_升任單位職稱', label: '調／升任單位職稱' },
  ],
  其他: [
    { value: '會議地點', label: '地點' },
    { value: '其他備註', label: '其他備註' },
    { value: '其他出處來源', label: '其他出處來源' },
  ],
};

const STORAGE_KEY = 'rosterSearchState';

const DEFAULT_LIST_COLUMNS: ColumnConfig[] = [
  { column_name: '組織',    field_name: '組織',    display_label: '組織',    sort_order_list: 1, sort_order_detail: 1 },
  { column_name: '一級單位', field_name: '一級單位', display_label: '一級單位', sort_order_list: 2, sort_order_detail: 2 },
  { column_name: '二級單位', field_name: '二級單位', display_label: '二級單位', sort_order_list: 3, sort_order_detail: 3 },
  { column_name: '三級單位', field_name: '三級單位', display_label: '三級單位', sort_order_list: 4, sort_order_detail: 4 },
  { column_name: '職位',    field_name: '職位',    display_label: '職位',    sort_order_list: 5, sort_order_detail: 5 },
  { column_name: '屆次',    field_name: '屆次',    display_label: '屆次',    sort_order_list: 6, sort_order_detail: 6 },
];

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
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    stored?.filterConditions ?? []
  );

  // 欄位顯示設定
  const [listColumns, setListColumns] = useState<ColumnConfig[]>(stored?.listColumns ?? []);

  useEffect(() => {
    getColumns()
      .then(data => setListColumns(data.list))
      .catch(() => {});
  }, []);

  // API 狀態（allResults 為一次抓回的全部結果，排序與分頁皆在前端進行）
  const [allResults, setAllResults] = useState<Record<string, any>[]>(stored?.allResults ?? []);
  const [totalCount, setTotalCount] = useState<number>(stored?.totalCount ?? 0);
  const [currentPage, setCurrentPage] = useState<number>(stored?.currentPage ?? 1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState<boolean>(stored?.hasSearched ?? false);
  const [error, setError] = useState('');

  // 排序狀態（前端排序，套用於全部結果）
  const [sortColumn, setSortColumn] = useState<string | null>(stored?.sortColumn ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(stored?.sortDirection ?? 'asc');

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        quickSearchTab, allFieldsQuery, nameQuery, positionQuery,
        timeStartYear, timeEndYear, showAdvanced, advancedConditions,
        filterConditions, allResults, totalCount, currentPage, hasSearched,
        sortColumn, sortDirection,
      }));
    } catch {}
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, timeStartYear,
      timeEndYear, showAdvanced, advancedConditions, filterConditions, allResults,
      totalCount, currentPage, hasSearched, sortColumn, sortDirection]);

  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  // 全部結果排序（空值永遠排在最後；兩值皆為數字時做數值比較，否則用繁中 locale 比較）
  const sortedResults = useMemo(() => {
    if (!sortColumn) return allResults;
    const dir = sortDirection === 'asc' ? 1 : -1;
    const norm = (v: any) => (v == null ? '' : String(v).trim());
    return [...allResults].sort((ra, rb) => {
      const av = norm(ra[sortColumn]);
      const bv = norm(rb[sortColumn]);
      if (av === '' && bv === '') return 0;
      if (av === '') return 1;
      if (bv === '') return -1;
      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return dir * (an - bn);
      return dir * av.localeCompare(bv, 'zh-Hant');
    });
  }, [allResults, sortColumn, sortDirection]);

  // 前端分頁：取排序後當前頁的 50 筆
  const pagedResults = useMemo(
    () => sortedResults.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedResults, currentPage]
  );

  // 點擊欄位標頭切換排序：升冪 → 降冪 → 取消
  const toggleSort = (key: string) => {
    if (sortColumn !== key) {
      setSortColumn(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (key: string) => {
    if (sortColumn !== key) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 shrink-0" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 shrink-0" />
      : <ChevronDown className="w-3.5 h-3.5 shrink-0" />;
  };

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

  const addFilterCondition = () => {
    setFilterConditions([...filterConditions, {
      id: `filter-${Date.now()}`,
      field: '姓名',
      valueStatus: '有值',
      logicOperator: 'AND',
    }]);
    if (!showAdvanced) setShowAdvanced(true);
  };

  const removeFilterCondition = (id: string) => {
    setFilterConditions(filterConditions.filter(c => c.id !== id));
  };

  const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilterConditions(
      filterConditions.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const performSearch = useCallback(async () => {
    const queryFields: string[] = [];
    const searchValues: string[] = [];
    const searchOperators: string[] = [];

    const parseDate = (d: string) => ({
      year:  d ? d.slice(0, 4) : '',
      month: d && d.length >= 7 ? d.slice(5, 7) : '',
      day:   d && d.length >= 10 ? d.slice(8, 10) : '',
    });

    // 空格拆分成多個 OR 條件；第一個保留原 operator，後續改為 or
    const pushExpanded = (field: string, rawValue: string, firstOp: string) => {
      const tokens = rawValue.trim().split(/\s+/).filter(Boolean);
      tokens.forEach((token, i) => {
        queryFields.push(field);
        searchValues.push(token);
        searchOperators.push(i === 0 ? firstOp : 'or');
      });
    };

    // 快速搜尋（文字）
    if (quickSearchTab === 'all' && allFieldsQuery.trim()) {
      pushExpanded('全欄位', allFieldsQuery, 'and');
    } else if (quickSearchTab === 'person' && nameQuery.trim()) {
      pushExpanded('姓名_別名', nameQuery, 'and');
    } else if (quickSearchTab === 'position' && positionQuery.trim()) {
      pushExpanded('職位', positionQuery, 'and');
    }

    // 進階搜尋：startDate/endDate 走日期路徑，其餘走文字路徑
    type DateSlot = { sY: string; sM: string; sD: string; eY: string; eM: string; eD: string; op: string };
    const advDateSlots: DateSlot[] = [];

    advancedConditions.forEach(c => {
      if ((c.field === 'startDate' || c.field === 'endDate') && c.value.trim()) {
        const d = parseDate(c.value);
        const isStart = c.field === 'startDate';
        advDateSlots.push({
          sY: isStart ? d.year  : '', sM: isStart ? d.month : '', sD: isStart ? d.day : '',
          eY: isStart ? ''      : d.year,  eM: isStart ? ''      : d.month, eD: isStart ? '' : d.day,
          op: toDjangoOperator(c.logicOperator),
        });
      } else if (c.value.trim()) {
        pushExpanded(toDjangoSearchField(c.field), c.value, toDjangoOperator(c.logicOperator));
      }
    });

    // 快速搜尋時間 tab + 進階搜尋日期條件合併
    const allDateSlots: DateSlot[] = [];
    if (quickSearchTab === 'time' && (timeStartYear || timeEndYear)) {
      const s = parseDate(timeStartYear);
      const e = parseDate(timeEndYear);
      allDateSlots.push({ sY: s.year, sM: s.month, sD: s.day, eY: e.year, eM: e.month, eD: e.day, op: 'and' });
    }
    allDateSlots.push(...advDateSlots);

    const hasTextSearch = queryFields.length > 0;
    const hasDateSearch = allDateSlots.length > 0;

    // 組裝篩選條件（有值／為空）
    const activeFilterConditions = filterConditions.filter(c => c.field);
    const hasFilterSearch = activeFilterConditions.length > 0;

    if (!hasTextSearch && !hasDateSearch && !hasFilterSearch) {
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
        startYears:    hasDateSearch ? allDateSlots.map(s => s.sY) : undefined,
        startMonths:   hasDateSearch ? allDateSlots.map(s => s.sM) : undefined,
        startDays:     hasDateSearch ? allDateSlots.map(s => s.sD) : undefined,
        endYears:      hasDateSearch ? allDateSlots.map(s => s.eY) : undefined,
        endMonths:     hasDateSearch ? allDateSlots.map(s => s.eM) : undefined,
        endDays:       hasDateSearch ? allDateSlots.map(s => s.eD) : undefined,
        dateOperators: hasDateSearch ? allDateSlots.map(s => s.op) : undefined,
        isValueFields:    hasFilterSearch ? activeFilterConditions.map(c => c.field) : undefined,
        isValues:         hasFilterSearch ? activeFilterConditions.map(c => c.valueStatus) : undefined,
        isValueOperators: hasFilterSearch ? activeFilterConditions.map(c => toDjangoOperator(c.logicOperator)) : undefined,
        page: 1,
        pageSize: 300,  // 一次抓滿足條件的全部結果（後端上限 300），由前端排序＋分頁
      });

      setAllResults(data.results as Record<string, any>[]);
      setTotalCount(data.count);
      setCurrentPage(1);
      setSortColumn(null);
      setSortDirection('asc');
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || '搜尋失敗');
      setAllResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, timeStartYear, timeEndYear, advancedConditions, filterConditions]);

  const handleSearch = () => performSearch();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSearch();
  };

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
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
    filterConditions.forEach((c, index) => {
      const fieldLabel = Object.values(filterFieldGroups).flat().find(f => f.value === c.field)?.label ?? c.field;
      const prefix = (filters.length > 0 || index > 0) ? ` ${c.logicOperator} ` : '';
      filters.push(`${prefix}${fieldLabel}：${c.valueStatus}`);
    });
    return filters;
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, timeStartYear, timeEndYear, advancedConditions, filterConditions]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="ink-header text-white py-10 sm:py-14 lg:py-16 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 brush-title">職名錄檢索</h1>
          <p className="text-gray-200 text-sm sm:text-base lg:text-lg">
            查詢自興中會至中國國民黨第十四屆中央委員會重要職名
          </p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Search */}
        <div className="paper-card rounded-lg mb-6 seal-corner p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 ink-text seal-left">快速查詢</h3>
          <div>
            <Tabs value={quickSearchTab} onValueChange={setQuickSearchTab} className="w-full">
              <div className="ink-tabs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
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
                    <DateInput value={timeStartYear}
                      onChange={setTimeStartYear} onKeyDown={handleKeyDown} className="paper-input" />
                  </div>
                  <div>
                    <label className="block text-sm ink-text mb-2 font-medium">結束日期</label>
                    <DateInput value={timeEndYear}
                      onChange={setTimeEndYear} onKeyDown={handleKeyDown} className="paper-input" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* 搜尋按鈕 */}
            <div className="mt-4 flex justify-stretch sm:justify-end">
              <button onClick={handleSearch} disabled={isLoading}
                className="ink-button w-full sm:w-auto px-6 sm:px-8 py-2 rounded flex items-center justify-center space-x-2 disabled:opacity-50">
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
                  <div key={condition.id} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 pb-4 border-b border-neutral-200 last:border-0">
                    {index > 0 ? (
                      <Select value={condition.logicOperator}
                        onValueChange={value => updateCondition(condition.id, { logicOperator: value as 'AND' | 'OR' | 'NOT' })}>
                        <SelectTrigger className="w-full md:w-32 border-neutral-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">且 (AND)</SelectItem>
                          <SelectItem value="OR">或 (OR)</SelectItem>
                          <SelectItem value="NOT">非 (NOT)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <div className="hidden md:block md:w-32" />}

                    <Select value={condition.field}
                      onValueChange={value => {
                        const prevIsDate = condition.field === 'startDate' || condition.field === 'endDate';
                        const nextIsDate = value === 'startDate' || value === 'endDate';
                        updateCondition(condition.id, {
                          field: value,
                          ...(prevIsDate !== nextIsDate ? { value: '' } : {}),
                        });
                      }}>
                      <SelectTrigger className="w-full md:w-64 border-neutral-300"><SelectValue /></SelectTrigger>
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
                      <div className="w-full md:flex-1">
                        <DateInput value={condition.value}
                          onChange={v => updateCondition(condition.id, { value: v })}
                          onKeyDown={handleKeyDown} className="border-neutral-300" />
                      </div>
                    ) : (
                      <Input placeholder="輸入查詢內容" value={condition.value}
                        onChange={e => updateCondition(condition.id, { value: e.target.value })}
                        onKeyDown={handleKeyDown} className="w-full md:flex-1 border-neutral-300" />
                    )}

                    <Button variant="ghost" size="sm" onClick={() => removeCondition(condition.id)}
                      className="self-end md:self-auto text-neutral-600 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={addCondition} variant="outline" size="sm" className="border-neutral-300 text-neutral-700">
                    <Plus className="w-4 h-4 mr-2" />新增查詢條件
                  </Button>
                  <Button onClick={addFilterCondition} variant="outline" size="sm" className="border-neutral-300 text-neutral-700">
                    <Plus className="w-4 h-4 mr-2" />新增篩選條件
                  </Button>
                </div>

                {/* 篩選條件（有值／為空）*/}
                {filterConditions.length > 0 && (
                  <>
                    <div className="cloud-divider !my-3" />
                    <p className="text-xs text-neutral-500 font-medium tracking-wide">欄位資料篩選</p>
                    {filterConditions.map((condition, index) => (
                      <div key={condition.id} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 pb-4 border-b border-neutral-200 last:border-0">
                        {index > 0 ? (
                          <Select value={condition.logicOperator}
                            onValueChange={value => updateFilterCondition(condition.id, { logicOperator: value as 'AND' | 'OR' | 'NOT' })}>
                            <SelectTrigger className="w-full md:w-32 border-neutral-300"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">且 (AND)</SelectItem>
                              <SelectItem value="OR">或 (OR)</SelectItem>
                              <SelectItem value="NOT">非 (NOT)</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : <div className="hidden md:block md:w-32" />}

                        <Select value={condition.field}
                          onValueChange={value => updateFilterCondition(condition.id, { field: value })}>
                          <SelectTrigger className="w-full md:w-64 border-neutral-300"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(filterFieldGroups).map(([groupName, fields]) => (
                              <div key={groupName}>
                                <div className="px-2 py-1.5 text-xs font-medium text-neutral-500">{groupName}</div>
                                {fields.map(field => (
                                  <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={condition.valueStatus}
                          onValueChange={value => updateFilterCondition(condition.id, { valueStatus: value as '有值' | '為空' })}>
                          <SelectTrigger className="w-full md:flex-1 border-neutral-300"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="有值">有資料</SelectItem>
                            <SelectItem value="為空">無資料</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button variant="ghost" size="sm" onClick={() => removeFilterCondition(condition.id)}
                          className="self-end md:self-auto text-neutral-600 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
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
                  {(() => { const cols = listColumns.length > 0 ? listColumns : DEFAULT_LIST_COLUMNS; return (
                  <tr>
                    <th className="sticky left-0 px-4 py-3 text-left font-medium border-r border-gray-600/30 bg-[#34495e]">序號</th>
                    <th className="sticky left-16 p-0 font-medium border-r border-gray-600/30 bg-[#34495e]">
                      <button type="button" onClick={() => toggleSort('姓名')}
                        className="w-full px-4 py-3 flex items-center gap-1 text-left select-none hover:text-[#e8d4a0] transition-colors">
                        <span>姓名</span>{renderSortIcon('姓名')}
                      </button>
                    </th>
                    {cols.map(col => (
                      <th key={col.field_name} className="p-0 font-medium whitespace-nowrap">
                        <button type="button" onClick={() => toggleSort(col.field_name)}
                          className="w-full px-4 py-3 flex items-center gap-1 text-left select-none hover:text-[#e8d4a0] transition-colors">
                          <span>{col.display_label}</span>{renderSortIcon(col.field_name)}
                        </button>
                      </th>
                    ))}
                  </tr>
                  ); })()}
                </thead>
                <tbody>
                  {(() => { const cols = listColumns.length > 0 ? listColumns : DEFAULT_LIST_COLUMNS; return pagedResults.map((record, index) => (
                    <tr key={record.id}>
                      <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200 font-mono text-xs text-gray-600">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="sticky left-16 bg-white px-4 py-3 border-r border-gray-200 font-medium ink-text">
                        <Link to={`/roster/${record.id}`} className="hover:text-[#16a085] hover:underline transition-colors">
                          {record['姓名']}
                        </Link>
                      </td>
                      {cols.map(col => (
                        <td key={col.field_name} className="px-4 py-3 text-gray-700">{record[col.field_name] || '—'}</td>
                      ))}
                    </tr>
                  )); })()}
                </tbody>
              </table>
            </div>

            {allResults.length === 0 && (
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
                  onClick={() => setCurrentPage(currentPage - 1)} className="border-neutral-300">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm ink-text px-4">
                  第 {currentPage} / {totalPages} 頁
                </span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)} className="border-neutral-300">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Initial state - no search yet */}
        {!isLoading && !hasSearched && (
          <div className="paper-card rounded-lg p-6 sm:p-12 text-center">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              aria-label="搜尋"
              className="block mx-auto mb-4 text-gray-300 hover:text-[#16a085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <SearchIcon className="w-12 h-12 sm:w-16 sm:h-16" />
            </button>
            <p className="text-base ink-text">請輸入查詢條件並點擊搜尋</p>
            <p className="mt-2 text-sm text-gray-500">支援全欄位、姓名、職位、時間範圍等多種搜尋方式</p>
          </div>
        )}
      </div>
    </div>
  );
}
