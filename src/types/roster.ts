/**
 * 職名錄單筆記錄的資料結構。
 * 對應後端 Django model 的中文欄位（透過 field-mapping.ts 轉換）。
 */
export interface RosterRecord {
  id: string;
  name: string;
  organization?: string;
  alias?: string;
  previousName?: string;
  nextName?: string;
  unit1?: string;
  unit2?: string;
  unit3?: string;
  position?: string;
  term?: string;
  startDate?: string;
  endDate?: string;
  startDateSource?: string;
  endDateSource?: string;
  appointmentMethod?: string;
  concurrent?: string;
  order?: number;
  resignationReason?: string;
  transferPosition?: string;
  meetingLocation?: string;
  notes?: string;
  otherSources?: string;
}
