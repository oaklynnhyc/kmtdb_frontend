/**
 * Django 中文欄位名 <-> React 英文欄位名 雙向映射。
 *
 * 後端 API 回傳的 JSON key 為中文（如 '姓名'、'一級單位'），
 * 前端使用英文介面（如 name、unit1）。
 *
 * 映射對照表亦收錄於 API_SPEC.md 第 5 節。
 */
import type { RosterRecord } from '@/types/roster';

// Django model field name -> React interface key
const DJANGO_TO_REACT: Record<string, keyof RosterRecord> = {
  'id': 'id',
  '姓名': 'name',
  '別名': 'alias',
  '前任姓名': 'previousName',
  '後任姓名': 'nextName',
  '一級單位': 'unit1',
  '二級單位': 'unit2',
  '三級單位': 'unit3',
  '職位': 'position',
  '屆次': 'term',
  '起始日期': 'startDate',
  '結束日期': 'endDate',
  '起始日期來源_原因': 'startDateSource',
  '結束日期來源_原因': 'endDateSource',
  '產生方式': 'appointmentMethod',
  '兼_代': 'concurrent',
  '序位': 'order',
  '離職原因': 'resignationReason',
  '調_升任單位職稱': 'transferPosition',
  '會議地點': 'meetingLocation',
  '其他備註': 'notes',
  '其他出處來源': 'otherSources',
  '組織': 'organization',
  'peopleid': 'id',
};

// React field name -> Django Query_Field name（用於搜尋參數建構）
const REACT_TO_DJANGO_SEARCH: Record<string, string> = {
  'name': '姓名_別名',
  'previousName': '前任姓名',
  'nextName': '後任姓名',
  'unit1': '一級單位',
  'unit2': '二級單位',
  'unit3': '三級單位',
  'position': '職位',
  'term': '屆次',
  'startDate': '起始日期',
  'endDate': '結束日期',
  'startDateSource': '起始日期來源_原因',
  'endDateSource': '結束日期來源_原因',
  'appointmentMethod': '產生方式',
  'concurrent': '兼_代',
  'order': '序位',
  'resignationReason': '離職原因',
  'transferPosition': '調_升任單位職稱',
  'meetingLocation': '會議地點',
  'notes': '其他備註',
  'otherSources': '其他出處來源',
  'all': '全欄位',
};

/**
 * 將 Django API 回傳的中文欄位名物件轉換為 RosterRecord
 */
export function mapDjangoToRoster(data: Record<string, any>): RosterRecord {
  const result: any = {};

  result.id = String(data.id ?? data.peopleid ?? '');

  for (const [djangoKey, reactKey] of Object.entries(DJANGO_TO_REACT)) {
    if (djangoKey in data && data[djangoKey] !== undefined) {
      if (reactKey === 'id') continue;
      if (reactKey === 'order') {
        result[reactKey] = data[djangoKey] ? Number(data[djangoKey]) : undefined;
      } else {
        result[reactKey] = data[djangoKey];
      }
    }
  }

  return result as RosterRecord;
}

/**
 * 將 React 前端的搜尋欄位名轉換為 Django Query_Field 值
 */
export function toDjangoSearchField(reactField: string): string {
  return REACT_TO_DJANGO_SEARCH[reactField] || reactField;
}

/**
 * 將邏輯運算子從前端格式轉換為後端格式
 */
export function toDjangoOperator(op: string): string {
  const map: Record<string, string> = {
    'AND': 'and',
    'OR': 'or',
    'NOT': 'not',
  };
  return map[op] || op.toLowerCase();
}
