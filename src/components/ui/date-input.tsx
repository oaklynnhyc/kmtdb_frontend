import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

/**
 * 自動格式化日期字串：使用者輸入純數字，自動插入 `-` 分隔符。
 * 支援部分日期：YYYY、YYYY-MM、YYYY-MM-DD。
 */
function formatDateDigits(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/**
 * 日期輸入元件：支援鍵盤直接輸入（自動格式化 YYYY-MM-DD）與日曆選取兩種方式。
 *
 * - 文字輸入：只接受數字，自動在第 4、6 位後插入 `-`
 * - 日曆按鈕：點擊右側日曆圖示開啟瀏覽器原生日期選取器
 * - 支援部分日期（僅年份、年月）
 */
export function DateInput({ value, onChange, onKeyDown, className }: DateInputProps) {
  const dateRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatDateDigits(e.target.value));
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) onChange(e.target.value);
  };

  const openCalendar = () => {
    try {
      dateRef.current?.showPicker();
    } catch {
      dateRef.current?.click();
    }
  };

  // 僅完整日期才傳入隱藏的 date picker，避免無效值警告
  const datePickerValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleTextChange}
        onKeyDown={onKeyDown}
        placeholder="YYYY-MM-DD"
        maxLength={10}
        className={`pr-9 ${className || ''}`}
      />
      {/* 隱藏的原生日期選取器，供日曆按鈕觸發 */}
      <input
        ref={dateRef}
        type="date"
        value={datePickerValue}
        onChange={handleCalendarChange}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 'none',
        }}
      />
      {/* 日曆圖示按鈕 */}
      <button
        type="button"
        onClick={openCalendar}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(44,62,80,0.55)] hover:text-[rgba(44,62,80,0.8)] transition-colors cursor-pointer"
        tabIndex={-1}
        aria-label="開啟日曆"
      >
        <Calendar className="w-4 h-4" />
      </button>
    </div>
  );
}
