import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
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
    { value: 'startDateSource', label: '任用依據' },
    { value: 'endDateSource', label: '離職依據' },
  ],
  任用與異動: [
    { value: 'appointmentMethod', label: '產生方式' },
    { value: 'concurrent', label: '兼／代' },
    { value: 'order', label: '序位' },
    { value: 'resignationReason', label: '離職原因' },
    { value: 'transferPosition', label: '調／升任單位職稱' },
  ],
  其他: [
    { value: 'meetingLocation', label: '地點備註' },
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
    { value: '任用依據', label: '任用依據' },
    { value: '離職依據', label: '離職依據' },
  ],
  任用與異動: [
    { value: '產生方式', label: '產生方式' },
    { value: '兼_代', label: '兼／代' },
    { value: '序位', label: '序位' },
    { value: '離職原因', label: '離職原因' },
    { value: '調_升任單位職稱', label: '調／升任單位職稱' },
  ],
  其他: [
    { value: '地點備註', label: '地點備註' },
    { value: '其他備註', label: '其他備註' },
    { value: '其他出處來源', label: '其他出處來源' },
  ],
};

/** 快速查詢「屆次」下拉建議：可從清單選取，也可自行輸入（後端以 __icontains 模糊比對）。
 *  內容為資料庫「屆次」欄位的 distinct 值（來源：backups/kmtdb_full_20260708，共 30 種）。 */
const TERM_OPTIONS = [
  '興中會', '香港興中會總會', '中國同盟會', '國民黨', '中華革命黨', '中國國民黨（改組前）',
  '上海中央執行委員會第1屆', '上海中央執行委員會第2屆',
  '中國國民黨第1屆', '中國國民黨第2屆', '中國國民黨第3屆', '中國國民黨第4屆', '中國國民黨第5屆',
  '中國國民黨第6屆', '中國國民黨第7屆', '中國國民黨第8屆', '中國國民黨第9屆', '中國國民黨第10屆',
  '中國國民黨第11屆', '中國國民黨第12屆', '中國國民黨第13屆', '中國國民黨第14屆',
  '中央改造委員會',
  '三民主義青年團籌備會', '三民主義青年團中央臨時幹事會',
  '三民主義青年團第1屆', '三民主義青年團第1任', '三民主義青年團第2屆', '三民主義青年團第2任',
  '革命實踐研究院',
];

const STORAGE_KEY = 'rosterSearchState';

const DEFAULT_LIST_COLUMNS: ColumnConfig[] = [
  { column_name: '組織',    field_name: '組織',    display_label: '組織',    sort_order_list: 1, sort_order_detail: 1 },
  { column_name: '一級單位', field_name: '一級單位', display_label: '一級單位', sort_order_list: 2, sort_order_detail: 2 },
  { column_name: '二級單位', field_name: '二級單位', display_label: '二級單位', sort_order_list: 3, sort_order_detail: 3 },
  { column_name: '三級單位', field_name: '三級單位', display_label: '三級單位', sort_order_list: 4, sort_order_detail: 4 },
  { column_name: '職位',    field_name: '職位',    display_label: '職位',    sort_order_list: 5, sort_order_detail: 5 },
  { column_name: '屆次',    field_name: '屆次',    display_label: '屆次',    sort_order_list: 6, sort_order_detail: 6 },
];

interface RelevanceTerm { value: string; fields: string[] }

/**
 * 關聯性排序：把後端回傳結果依「命中查詢詞數」重排（多者在前，同分維持 id 序）。
 * 兩個純函式配套：buildRelevanceTerms 在搜尋時把送後端的查詢陣列組成 terms（排除 NOT），
 * sortByRelevance 在渲染時用 terms 對結果算分排序。
 */
function buildRelevanceTerms(
  queryFields: string[], searchValues: string[], searchOperators: string[],
): RelevanceTerm[] {
  // 對齊 search/services.py 的「全欄位」比對範圍（值為 record 的 JSON key）
  const ALL_FIELDS = [
    '姓名', '別名', '組織', '一級單位', '二級單位', '三級單位', '職位', '屆次',
    '任用依據', '離職依據', '前任姓名', '後任姓名', '產生方式', '序位',
    '兼_代', '離職原因', '調_升任單位職稱', '其他備註', '地點備註', '其他出處來源',
  ];
  const fieldsOf = (f: string) =>
    f === '全欄位' ? ALL_FIELDS : f === '姓名_別名' ? ['姓名', '別名'] : [f];
  return queryFields
    .map((f, i) => ({ f, v: searchValues[i], op: searchOperators[i] }))
    .filter(t => t.op !== 'not' && t.v)          // NOT 為排除、空值略過
    .map(t => ({ value: t.v, fields: fieldsOf(t.f) }));
}

function sortByRelevance(
  results: Record<string, any>[], terms: RelevanceTerm[],
): Record<string, any>[] {
  if (terms.length < 2) return results;          // 單一詞全部同分，維持後端 id 序
  const score = (r: Record<string, any>) =>
    terms.reduce((n, t) =>
      n + (t.fields.some(f => r[f] != null && String(r[f]).includes(t.value)) ? 1 : 0), 0);
  return results
    .map((r, i) => ({ r, i, s: score(r) }))
    .sort((a, b) => (b.s - a.s) || (a.i - b.i))   // 命中多者在前，同分維持原順序
    .map(x => x.r);
}

function loadStoredState(): any {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 屆次 combobox：可自由輸入，也可從下拉清單選取；下拉樣式與進階查詢的 Select 一致 */
function TermCombobox({
  value,
  onChange,
  onSearch,
  onSelect,
  placeholder = '可選擇或輸入屆次，例如：第1屆、1',
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  onSelect?: (v: string) => void;  // 從清單選取時觸發（直接查詢）
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const keyword = value.trim();
  const filtered = keyword ? TERM_OPTIONS.filter(o => o.includes(keyword)) : TERM_OPTIONS;

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) { setOpen(false); onSearch(); }
        }}
        className="paper-input"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(opt); setOpen(false); onSelect?.(opt); }}
              className="w-full text-left rounded-sm px-2 py-1.5 text-sm cursor-default hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 快速查詢分頁的條列說明（暖金 ◆ 標記，貼合網站風格） */
function QuickHint({ items }: { items: string[] }) {
  return (
    <ul className="text-sm text-gray-600 mb-3 space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="text-[#d4af37] flex-shrink-0 leading-relaxed">◆</span>
          <span className="leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function RosterSearch() {
  const navigate = useNavigate();
  const stored = loadStoredState();

  const [quickSearchTab, setQuickSearchTab] = useState<string>(stored?.quickSearchTab ?? 'all');
  const [allFieldsQuery, setAllFieldsQuery] = useState<string>(stored?.allFieldsQuery ?? '');
  const [nameQuery, setNameQuery] = useState<string>(stored?.nameQuery ?? '');
  const [positionQuery, setPositionQuery] = useState<string>(stored?.positionQuery ?? '');
  const [termQuery, setTermQuery] = useState<string>(stored?.termQuery ?? '');
  const [timeStartYear, setTimeStartYear] = useState<string>(stored?.timeStartYear ?? '');
  const [timeEndYear, setTimeEndYear] = useState<string>(stored?.timeEndYear ?? '');

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
  // 當前顯示結果所使用的查詢模式（快速／進階），用於摘要標記
  const [searchedMode, setSearchedMode] = useState<'quick' | 'advanced' | null>(stored?.searchedMode ?? null);
  const [error, setError] = useState('');

  // 排序狀態（前端排序，套用於全部結果）
  const [sortColumn, setSortColumn] = useState<string | null>(stored?.sortColumn ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(stored?.sortDirection ?? 'asc');

  // 關聯性排序依據：所有非 NOT 的查詢詞（快速＋進階），供預設排序算分
  const [relevanceTerms, setRelevanceTerms] = useState<RelevanceTerm[]>(stored?.relevanceTerms ?? []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        quickSearchTab, allFieldsQuery, nameQuery, positionQuery, termQuery,
        timeStartYear, timeEndYear, advancedConditions,
        filterConditions, allResults, totalCount, currentPage, hasSearched,
        searchedMode, sortColumn, sortDirection, relevanceTerms,
      }));
    } catch {}
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, termQuery, timeStartYear,
      timeEndYear, advancedConditions, filterConditions, allResults,
      totalCount, currentPage, hasSearched, searchedMode, sortColumn, sortDirection, relevanceTerms]);

  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  // 全部結果排序（空值永遠排在最後；兩值皆為數字時做數值比較，否則用繁中 locale 比較）
  const sortedResults = useMemo(() => {
    if (!sortColumn) return sortByRelevance(allResults, relevanceTerms);  // 預設：關聯性排序
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
  }, [allResults, sortColumn, sortDirection, relevanceTerms]);

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
  };

  const removeFilterCondition = (id: string) => {
    setFilterConditions(filterConditions.filter(c => c.id !== id));
  };

  const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilterConditions(
      filterConditions.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // mode 決定資料來源：'quick' 只用快速查詢分頁條件；'advanced' 只用進階條件＋篩選。
  // 兩模式完全獨立，不互相帶入對方欄位的值。
  const performSearch = useCallback(async (mode: 'quick' | 'advanced') => {
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

    type DateSlot = { sY: string; sM: string; sD: string; eY: string; eM: string; eD: string; op: string };
    const allDateSlots: DateSlot[] = [];
    let activeFilterConditions: FilterCondition[] = [];

    // 快速查詢條件（兩種模式都會用到；進階模式以此為基礎範圍再疊加進階條件 narrow down）
    const buildQuick = () => {
      if (quickSearchTab === 'all' && allFieldsQuery.trim()) {
        pushExpanded('全欄位', allFieldsQuery, 'and');
      } else if (quickSearchTab === 'person' && nameQuery.trim()) {
        pushExpanded('姓名_別名', nameQuery, 'and');
      } else if (quickSearchTab === 'position' && positionQuery.trim()) {
        pushExpanded('職位', positionQuery, 'and');
      } else if (quickSearchTab === 'term' && termQuery.trim()) {
        pushExpanded('屆次', termQuery, 'and');
      } else if (quickSearchTab === 'time' && (timeStartYear || timeEndYear)) {
        const s = parseDate(timeStartYear);
        const e = parseDate(timeEndYear);
        allDateSlots.push({ sY: s.year, sM: s.month, sD: s.day, eY: e.year, eM: e.month, eD: e.day, op: 'and' });
      }
    };

    if (mode === 'quick') {
      // 快速查詢：只用快速查詢條件
      buildQuick();
    } else {
      // 進階查詢：先帶入快速查詢條件作為基礎範圍，再疊加進階查詢條件與篩選（startDate/endDate 走日期路徑）
      buildQuick();
      advancedConditions.forEach(c => {
        if ((c.field === 'startDate' || c.field === 'endDate') && c.value.trim()) {
          const d = parseDate(c.value);
          const isStart = c.field === 'startDate';
          allDateSlots.push({
            sY: isStart ? d.year  : '', sM: isStart ? d.month : '', sD: isStart ? d.day : '',
            eY: isStart ? ''      : d.year,  eM: isStart ? ''      : d.month, eD: isStart ? '' : d.day,
            op: toDjangoOperator(c.logicOperator),
          });
        } else if (c.value.trim()) {
          pushExpanded(toDjangoSearchField(c.field), c.value, toDjangoOperator(c.logicOperator));
        }
      });
      activeFilterConditions = filterConditions.filter(c => c.field);
    }

    const hasTextSearch = queryFields.length > 0;
    const hasDateSearch = allDateSlots.length > 0;

    // 關聯性排序依據：所有非 NOT 的查詢詞（AND 詞對每筆同加分不影響順序，NOT 為排除不計）
    const relTerms = buildRelevanceTerms(queryFields, searchValues, searchOperators);

    const hasFilterSearch = activeFilterConditions.length > 0;

    if (!hasTextSearch && !hasDateSearch && !hasFilterSearch) {
      setError('請至少輸入一個搜尋條件');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 共用查詢條件（不含分頁參數）
      const searchPayload = {
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
      };

      // 後端每頁上限為 300，故分頁抓取：先抓第 1 頁取得總筆數，
      // 其餘頁面並行抓取後合併，前端再自行排序＋分頁（不再受 300 筆限制）。
      const BACKEND_MAX_PAGE_SIZE = 300;
      const first = await searchRecords({ ...searchPayload, page: 1, pageSize: BACKEND_MAX_PAGE_SIZE });
      const total = first.count;
      let merged = first.results as Record<string, any>[];

      const totalPages = Math.ceil(total / BACKEND_MAX_PAGE_SIZE);
      if (totalPages > 1) {
        const restPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            searchRecords({ ...searchPayload, page: i + 2, pageSize: BACKEND_MAX_PAGE_SIZE })
          )
        );
        for (const pageData of restPages) {
          merged = merged.concat(pageData.results as Record<string, any>[]);
        }
      }

      setAllResults(merged);
      setTotalCount(total);
      setCurrentPage(1);
      setSortColumn(null);
      setSortDirection('asc');
      setRelevanceTerms(relTerms);
      setHasSearched(true);
      setSearchedMode(mode);
    } catch (err: any) {
      setError(err.message || '搜尋失敗');
      setAllResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, termQuery, timeStartYear, timeEndYear, advancedConditions, filterConditions]);

  const handleQuickSearch = () => performSearch('quick');
  const handleAdvancedSearch = () => performSearch('advanced');
  const onQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleQuickSearch();
  };
  const onAdvancedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdvancedSearch();
  };

  // 屆次瀏覽：從清單選取後直接查詢（快速查詢模式）。用 ref 保存最新 performSearch，
  // 待 termQuery 狀態更新後的下一個 render 再觸發（避免讀到舊值）。
  const performSearchRef = useRef(performSearch);
  performSearchRef.current = performSearch;
  const [autoSearchTick, setAutoSearchTick] = useState(0);
  useEffect(() => {
    if (autoSearchTick > 0) performSearchRef.current('quick');
  }, [autoSearchTick]);

  // 清空所有檢索條件與查詢結果（並清掉 sessionStorage 暫存）
  const handleClear = () => {
    setQuickSearchTab('all');
    setAllFieldsQuery('');
    setNameQuery('');
    setPositionQuery('');
    setTermQuery('');
    setTimeStartYear('');
    setTimeEndYear('');
    setAdvancedConditions([
      { id: 'default-1', field: 'name', operator: 'contains', value: '', logicOperator: 'AND' },
    ]);
    setFilterConditions([]);
    setAllResults([]);
    setTotalCount(0);
    setCurrentPage(1);
    setHasSearched(false);
    setSearchedMode(null);
    setSortColumn(null);
    setSortDirection('asc');
    setRelevanceTerms([]);
    setError('');
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };


  // 快速查詢條件摘要
  const quickFilters = useMemo(() => {
    const filters: string[] = [];
    if (quickSearchTab === 'all' && allFieldsQuery) filters.push(`全欄位：${allFieldsQuery}`);
    if (quickSearchTab === 'person' && nameQuery) filters.push(`人物姓名：${nameQuery}`);
    if (quickSearchTab === 'position' && positionQuery) filters.push(`職位：${positionQuery}`);
    if (quickSearchTab === 'term' && termQuery) filters.push(`屆次：${termQuery}`);
    if (quickSearchTab === 'time' && (timeStartYear || timeEndYear)) {
      filters.push(`任職時間：${timeStartYear || '不限'}–${timeEndYear || '不限'}`);
    }
    return filters;
  }, [quickSearchTab, allFieldsQuery, nameQuery, positionQuery, termQuery, timeStartYear, timeEndYear]);

  // 進階查詢條件摘要（含篩選）
  const advancedFilters = useMemo(() => {
    const filters: string[] = [];
    advancedConditions.forEach((c, index) => {
      if (c.value) {
        const field = Object.values(fieldGroups).flat().find(f => f.value === c.field);
        const fieldLabel = c.field === 'all' ? '全欄位' : field?.label;
        const prefix = index > 0 ? ` ${c.logicOperator} ` : '';
        filters.push(`${prefix}${fieldLabel}：${c.value}`);
      }
    });
    filterConditions.forEach((c, index) => {
      const fieldLabel = Object.values(filterFieldGroups).flat().find(f => f.value === c.field)?.label ?? c.field;
      const prefix = (filters.length > 0 || index > 0) ? ` ${c.logicOperator} ` : '';
      const statusLabel = c.valueStatus === '有值' ? '有資料' : '無資料';
      filters.push(`${prefix}${fieldLabel}：${statusLabel}`);
    });
    return filters;
  }, [advancedConditions, filterConditions]);

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
        {/* relative z-20：墊高快速查詢卡的堆疊脈絡，避免屆次下拉溢出部分被進階查詢卡覆蓋
            （paper-card 的 backdrop-filter 會建立堆疊脈絡，需在卡層級提升 z-index） */}
        <div className="paper-card rounded-lg mb-6 seal-corner p-4 sm:p-6 relative z-20">
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 ink-text seal-left">快速查詢</h3>
          <div>
            <Tabs value={quickSearchTab} onValueChange={setQuickSearchTab} className="w-full">
              <div className="ink-tabs">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                  {[
                    { key: 'all', label: '全欄位' },
                    { key: 'person', label: '人物姓名' },
                    { key: 'position', label: '職位' },
                    { key: 'time', label: '時間' },
                    { key: 'term', label: '屆次瀏覽' },
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
                <QuickHint items={[
                  '建議以單一關鍵字查詢；多個關鍵字請搭配進階查詢。',
                  '若查詢內容屬於特定類型（如屆次、人物姓名、職位或時間），建議切換至對應頁籤進行查詢。',
                  '如於快速查詢欄位以空格分隔多個關鍵詞，系統會將空格視為「或（OR）」進行查詢。',
                  '屆次請使用半形阿拉伯數字。',
                  '【搜尋欄範例】孫中山 興中會 文化工作會 第7屆',
                ]} />
                <Input placeholder="孫中山 興中會 文化工作會 第7屆" value={allFieldsQuery}
                  onChange={e => setAllFieldsQuery(e.target.value)} onKeyDown={onQuickKeyDown} className="paper-input" />
              </TabsContent>
              <TabsContent value="person" className="mt-4">
                <QuickHint items={[
                  '依人物姓名或別名查詢。',
                  '【搜尋欄範例】胡漢民 陳辭修 吳稚暉',
                ]} />
                <Input placeholder="胡漢民 陳辭修 吳稚暉" value={nameQuery}
                  onChange={e => setNameQuery(e.target.value)} onKeyDown={onQuickKeyDown} className="paper-input" />
              </TabsContent>
              <TabsContent value="term" className="mt-4">
                <QuickHint items={[
                  '點選搜尋欄或輸入關鍵字，將顯示符合條件的下拉選單。',
                  '如需重新搜尋，請刪除目前內容後重新選擇或輸入關鍵字。'
                ]} />
                <TermCombobox
                  value={termQuery}
                  onChange={setTermQuery}
                  onSearch={handleQuickSearch}
                  onSelect={() => setAutoSearchTick(t => t + 1)}
                />
              </TabsContent>
              <TabsContent value="position" className="mt-4">
                <QuickHint items={[
                  '依職位名稱查詢。',
                  '【搜尋欄範例】中央委員 中常委 主任委員',
                ]} />
                <Input placeholder="中央委員 中常委 主任委員" value={positionQuery}
                  onChange={e => setPositionQuery(e.target.value)} onKeyDown={onQuickKeyDown} className="paper-input" />
              </TabsContent>
              <TabsContent value="time" className="mt-4">
                <QuickHint items={[
                  '依任職期間查詢。',
                  '使用右側日曆選擇日期，或自行輸入日期；日期請使用半形阿拉伯數字。',
                  '起始日期與結束日期可擇一填寫，亦可僅輸入年份進行查詢。',
                ]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm ink-text mb-2 font-medium">起始日期</label>
                    <DateInput value={timeStartYear}
                      onChange={setTimeStartYear} onKeyDown={onQuickKeyDown} className="paper-input" />
                  </div>
                  <div>
                    <label className="block text-sm ink-text mb-2 font-medium">結束日期</label>
                    <DateInput value={timeEndYear}
                      onChange={setTimeEndYear} onKeyDown={onQuickKeyDown} className="paper-input" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* 快速查詢搜尋按鈕（僅用快速查詢條件）*/}
            <div className="mt-4 flex justify-stretch sm:justify-end">
              <button onClick={handleQuickSearch} disabled={isLoading}
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
            <CardTitle className="text-base">進階查詢</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                {advancedConditions.map((condition) => (
                  <div key={condition.id} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 pb-4 border-b border-neutral-200 last:border-0">
                    {/* 進階模式會以快速查詢為基礎再疊加，故第一條也提供 AND/OR/NOT（與快速條件的組合方式）*/}
                    <Select value={condition.logicOperator}
                      onValueChange={value => updateCondition(condition.id, { logicOperator: value as 'AND' | 'OR' | 'NOT' })}>
                      <SelectTrigger className="w-full md:w-32 border-neutral-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">且 (AND)</SelectItem>
                        <SelectItem value="OR">或 (OR)</SelectItem>
                        <SelectItem value="NOT">非 (NOT)</SelectItem>
                      </SelectContent>
                    </Select>

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
                        <SelectItem value="all">全欄位</SelectItem>
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
                          onKeyDown={onAdvancedKeyDown} className="border-neutral-300" />
                      </div>
                    ) : condition.field === 'term' ? (
                      <div className="w-full md:flex-1">
                        <TermCombobox
                          value={condition.value}
                          onChange={v => updateCondition(condition.id, { value: v })}
                          onSearch={handleAdvancedSearch}
                          placeholder="輸入查詢內容"
                        />
                      </div>
                    ) : (
                      <Input placeholder="輸入查詢內容" value={condition.value}
                        onChange={e => updateCondition(condition.id, { value: e.target.value })}
                        onKeyDown={onAdvancedKeyDown} className="w-full md:flex-1 border-neutral-300" />
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
                  <Button onClick={handleClear} variant="outline" size="sm" className="border-neutral-300 text-neutral-700">
                    <X className="w-4 h-4 mr-2" />清空所有條件
                  </Button>
                </div>

                {/* 篩選條件（有值／為空）*/}
                {filterConditions.length > 0 && (
                  <>
                    <div className="cloud-divider !my-3" />
                    <p className="text-xs text-neutral-500 font-medium tracking-wide">欄位資料篩選</p>
                    {filterConditions.map((condition, index) => (
                      <div key={condition.id} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 pb-4 border-b border-neutral-200 last:border-0">
                        {/* 進階區塊以快速查詢為基礎再疊加，篩選條件皆提供 AND/OR/NOT */}
                        <Select value={condition.logicOperator}
                          onValueChange={value => updateFilterCondition(condition.id, { logicOperator: value as 'AND' | 'OR' | 'NOT' })}>
                          <SelectTrigger className="w-full md:w-32 border-neutral-300"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">且 (AND)</SelectItem>
                            <SelectItem value="OR">或 (OR)</SelectItem>
                            <SelectItem value="NOT">非 (NOT)</SelectItem>
                          </SelectContent>
                        </Select>

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

                {/* 進階查詢搜尋按鈕（僅用進階查詢條件與篩選）*/}
                <div className="pt-2 flex justify-stretch sm:justify-end">
                  <button onClick={handleAdvancedSearch} disabled={isLoading}
                    className="ink-button w-full sm:w-auto px-6 sm:px-8 py-2 rounded flex items-center justify-center space-x-2 disabled:opacity-50">
                    <SearchIcon className="w-4 h-4" />
                    <span>{isLoading ? '搜尋中...' : '搜尋'}</span>
                  </button>
                </div>
              </div>
            </CardContent>
        </div>

        {/* Query Summary：分開列出快速／進階；標記本次結果所用模式。
            快速查詢＝只用快速條件；進階查詢＝以快速為基礎再疊加進階（兩者條件皆生效）。 */}
        {(quickFilters.length > 0 || advancedFilters.length > 0 || searchedMode) && (
          <div className="mb-4 p-4 query-ink-box rounded text-sm">
            <div className="font-medium ink-text mb-2 flex flex-wrap items-center gap-2">
              查詢條件摘要
              {searchedMode && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#16a085]/10 text-[#16a085] ring-1 ring-[#16a085]/30 font-medium">
                  本次結果：{searchedMode === 'advanced' ? '進階查詢（含快速查詢條件）' : '快速查詢'}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {([
                // 快速條件在兩種模式都生效；進階條件只有進階模式生效
                { key: 'quick', label: '快速查詢', filters: quickFilters, active: searchedMode !== null },
                { key: 'advanced', label: '進階查詢', filters: advancedFilters, active: searchedMode === 'advanced' },
              ] as const).map(row => (
                <div key={row.key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    row.active ? 'bg-[#16a085]/10 text-[#16a085] ring-1 ring-[#16a085]/30' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {row.label}{row.active && ' · 已套用'}
                  </span>
                  <span className={row.active ? 'ink-text' : 'text-neutral-400'}>
                    {row.filters.length ? row.filters.join(' ') : '（未設定）'}
                  </span>
                </div>
              ))}
            </div>
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
                    <tr key={record.id} onClick={() => navigate(`/roster/${record.id}`)}
                      className="group cursor-pointer">
                      <td className="sticky left-0 bg-white group-hover:bg-[#faf6ec] px-4 py-3 border-r border-gray-200 font-mono text-xs text-gray-600 transition-colors">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="sticky left-16 bg-white group-hover:bg-[#faf6ec] px-4 py-3 border-r border-gray-200 font-medium ink-text group-hover:text-[#16a085] transition-colors">
                        {record['姓名']}
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
              onClick={handleQuickSearch}
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
