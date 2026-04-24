import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, ChevronDown, ChevronUp, Database, FileText,
  PanelLeftClose, PanelLeftOpen, MessageCircle, Check, ChevronsDownUp, ChevronsUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatbotQuery } from "@/services/api";

type AnswerType = "ans_summary" | "ans_with_gpdb";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;            // 簡要回覆
  detailedContent?: string;   // 詳細回覆（TODO: 接後端 reply_detail 欄位）
  timestamp: Date;
  mode?: AnswerType;          // 此則回覆所使用的回答模式（僅 assistant 訊息）
  type?: "modeSwitch";        // 系統訊息類型（例如模式切換分隔線）
  queryDetails?: {
    sqlJsonl?: string;
    introContext?: string;
    sqlText?: string;
    gpdbParams?: string;
    gpdbResult?: string;
  };
}

const MODE_META: Record<AnswerType, { label: string; color: string; tint: string; icon: typeof FileText }> = {
  ans_summary: { label: "統整式", color: "#16a085", tint: "rgba(22, 160, 133, 0.08)", icon: FileText },
  ans_with_gpdb: { label: "官職資料庫", color: "#d4af37", tint: "rgba(212, 175, 55, 0.1)", icon: Database },
};

const FAQ_ITEMS = [
  "如何搜尋特定時期的職務資料？",
  "請說明典藏系統收錄的資料範圍",
  "組織沿革頁面有哪些內容？",
  "如何正確引用典藏資料？",
  "可以依職位或單位搜尋嗎？",
];

// TODO [後端串接]: 後端 API 就緒後，在 .env 加入 VITE_API_READY=true 即可切換為真實 API，
//                  確認穩定後刪除整個 MOCK_REPLIES 以及 handleSend 中的 MOCK 區塊。
const MOCK_REPLIES: Record<string, { summary: string; detail: string }> = {
  "如何搜尋特定時期的職務資料？": {
    summary: "您可以使用「名冊檢索」頁面的進階搜尋功能，透過設定起始日期與結束日期來篩選特定時期的職務資料。支援年、月、日三個層級的日期範圍設定。",
    detail: "以下為搜尋特定時期職務資料的完整操作說明：\n\n一、基本步驟\n\n1. 點擊上方導覽列的「名冊檢索」進入搜尋頁面\n2. 展開「進階檢索」區塊\n3. 在搜尋欄位中選擇「起始日期」或「結束日期」\n4. 輸入目標日期範圍，例如 1924-1937\n5. 可搭配其他條件（如姓名、職位）進一步縮小範圍\n\n二、日期格式\n\n系統支援以下格式：\n• 完整日期：1924-01-30\n• 僅年份：1924\n• 年月：1924-01\n\n三、進階技巧\n\n• 使用 AND 運算子組合多個日期條件，可精確定位「在任期間」\n• 搭配「屆次」欄位可更快找到特定屆期的資料\n• 例如：搜尋「起始日期 >= 1929」AND「結束日期 <= 1935」可找出第三、四屆的任職紀錄",
  },
  "請說明典藏系統收錄的資料範圍": {
    summary: "本系統收錄中國國民黨自 1894 年興中會創立至 1975 年蔣中正逝世期間的組織職名錄資料，涵蓋甲編（改組前各時期）與乙編（改組後各屆中央委員會）。",
    detail: "本典藏系統的資料範圍詳細說明如下：\n\n一、時間跨度\n\n自 1894 年興中會創立起，至 1975 年為止，涵蓋超過 80 年的組織人事紀錄。\n\n二、甲編：改組前各時期（1894-1924）\n\n• 興中會時期（1894-1905）\n• 中國同盟會時期（1905-1912）\n• 國民黨時期（1912-1914）\n• 中華革命黨時期（1914-1919）\n• 中國國民黨改組前（1919-1924）\n\n三、乙編：改組後各屆（1924-1975）\n\n• 第一屆至第十一屆中央執行委員會\n• 各屆中央監察委員會\n• 中央黨部各部會、委員會\n• 地方黨部重要職務\n\n四、資料欄位\n\n每筆紀錄包含：姓名、別名、組織、一至三級單位、職位、屆次、起訖日期、產生方式等共 22 個欄位。\n\n五、資料來源\n\n主要依據黨史會檔案、歷屆全國代表大會紀錄、中央委員會會議紀錄等原始文獻編纂而成。",
  },
  "組織沿革頁面有哪些內容？": {
    summary: "組織沿革頁面以時間軸方式呈現中國國民黨的組織演變歷程，分為甲編（改組前，1894-1924）與乙編（改組後，1924 起），每個時期可展開查看詳細的組織架構說明。",
    detail: "組織沿革頁面的完整內容結構如下：\n\n一、甲編：改組前各時期（1894-1924）\n\n依時間順序列出五個主要階段，每個階段包含：\n• 時期名稱與存續年代\n• 組織創立/改組背景\n• 主要領導人與核心組織架構\n• 重要歷史事件與組織變革\n\n二、乙編：改組後各屆中央委員會（1924 起）\n\n依屆次列出各屆資訊，包含：\n• 屆次與任期時間\n• 全國代表大會召開資訊\n• 中央執行委員會組成\n• 下設各部會、委員會架構\n• 該屆重要決議與組織調整\n\n三、頁面功能\n\n• 全部展開/收合：一鍵展開或收合所有時期的詳細內容\n• 各時期可獨立展開收合\n• 時間軸視覺化呈現組織演變脈絡",
  },
  "如何正確引用典藏資料？": {
    summary: "引用本系統資料時，建議標註「國民黨職名錄數位加值系統」作為資料來源，並附上查詢條件與檢索日期。具體引用格式視學術規範而定。",
    detail: "正確引用典藏資料的建議方式如下：\n\n一、基本引用格式\n\n「國民黨職名錄數位加值系統」，[檢索日期]，查詢條件：[具體條件]。\n\n二、範例\n\n• 學術論文：「據國民黨職名錄數位加值系統查詢（2026年3月27日檢索），蔣中正於第三屆中央執行委員會擔任常務委員會主席（1929-1931）。」\n\n• 註腳格式：國民黨職名錄數位加值系統，檢索日期：2026-03-27，查詢條件：姓名＝蔣中正。\n\n三、注意事項\n\n• 本系統資料僅供研究參考，使用前請自行評估\n• 建議交叉比對原始檔案文獻\n• 如發現資料有誤，歡迎透過系統回報",
  },
  "可以依職位或單位搜尋嗎？": {
    summary: "可以。在名冊檢索頁面的進階搜尋中，您可以選擇「職位」、「一級單位」、「二級單位」或「三級單位」作為搜尋欄位，輸入關鍵字即可查詢。也可組合多個條件進行精確搜尋。",
    detail: "依職位或單位搜尋的完整說明：\n\n一、依職位搜尋\n\n在進階搜尋中選擇「職位」欄位，輸入如：\n• 「主席」→ 找出所有擔任主席的紀錄\n• 「部長」→ 找出各部部長\n• 「委員」→ 找出所有委員（含常務委員、候補委員等）\n\n二、依單位搜尋\n\n單位分為三個層級：\n• 一級單位：如「中央執行委員會」、「中央監察委員會」\n• 二級單位：如「組織部」、「宣傳部」、「秘書處」\n• 三級單位：如各科、各室\n\n三、組合搜尋範例\n\n• 「一級單位＝中央執行委員會」AND「職位＝常務委員」→ 歷屆常務委員名單\n• 「二級單位＝組織部」AND「職位＝部長」→ 歷任組織部長\n• 「職位＝委員」AND「屆次＝第一屆」→ 第一屆所有委員",
  },
};

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "您好，歡迎使用國民黨職名錄數位加值系統研究助理。我可以協助您查詢職名錄資料庫、解答關於職名錄資料的疑問、提供歷史背景說明，以及協助您的研究工作。請問有什麼可以為您服務的嗎？",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [answerType, setAnswerType] = useState<AnswerType>("ans_summary");
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<AnswerType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUserMessage = messages.some((m) => m.role === "user");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modelDropdownOpen]);

  const selectMode = useCallback((mode: AnswerType) => {
    setModelDropdownOpen(false);
    if (mode === answerType) return;
    // 尚無對話時（只有歡迎語）直接切換，不彈提示
    if (!hasUserMessage) {
      setAnswerType(mode);
      return;
    }
    setPendingMode(mode);
  }, [answerType, hasUserMessage]);

  const confirmModeSwitch = useCallback(() => {
    if (!pendingMode) return;
    const newMode = pendingMode;
    setAnswerType(newMode);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: "system",
        type: "modeSwitch",
        content: "",
        mode: newMode,
        timestamp: new Date(),
      },
    ]);
    setPendingMode(null);
  }, [pendingMode]);

  const cancelModeSwitch = useCallback(() => setPendingMode(null), []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleDetails = (messageId: string) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const toggleReply = (messageId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue;
    setInputValue("");
    setIsTyping(true);

    // Auto-collapse sidebar on first user message
    if (!hasUserMessage) setSidebarOpen(false);

    // TODO [後端串接]: 移除整個 MOCK 區塊，只保留 try/catch 中的正式邏輯
    // ── MOCK START ─────────────────────────────────────────
    const useMock = !import.meta.env.VITE_API_READY;
    if (useMock) {
      // 模擬後端延遲
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const mockSummary = MOCK_REPLIES[query]?.summary
        ?? `根據職名錄資料庫查詢，與「${query}」相關的紀錄共有 17 筆，涵蓋第一屆至第六屆中央執行委員會多個職位。主要集中於中央執行委員會常務委員會及組織部相關單位。`;
      const mockDetail = MOCK_REPLIES[query]?.detail
        ?? `以下為「${query}」的詳細分析：\n\n一、相關職務紀錄（共 17 筆）\n\n` +
           `1. 中央執行委員會 — 常務委員（第一屆～第三屆，1924-1929）\n` +
           `2. 中央執行委員會 組織部 — 部長（第三屆，1929-1931）\n` +
           `3. 中央執行委員會 — 委員（第四屆～第六屆，1931-1945）\n` +
           `4. 中央監察委員會 — 常務監察委員（第四屆，1931-1935）\n\n` +
           `二、任職時間軸\n\n最早紀錄始於 1924 年第一次全國代表大會，末筆紀錄止於 1945 年第六屆中央執行委員會屆滿。跨越國民黨改組、北伐、訓政及抗戰等重要時期。\n\n` +
           `三、資料來源\n\n以上資料來源涵蓋職名錄資料庫中相關紀錄，並交叉比對各屆次前言與組織沿革資訊。如需進一步查詢特定職位的完整歷史紀錄，請提供更具體的搜尋條件。`;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: mockSummary,
        detailedContent: mockDetail,
        timestamp: new Date(),
        mode: answerType,
        queryDetails: {
          sqlJsonl: '[{"姓名":"模擬資料","職位":"委員","屆次":"第一屆"}]',
          introContext: "第一屆中央執行委員會概述（模擬資料）",
          sqlText: "SELECT * FROM roster WHERE 姓名 LIKE '%...%' （模擬）",
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      return;
    }
    // ── MOCK END ───────────────────────────────────────────

    try {
      const data = await chatbotQuery(query, answerType);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        // TODO [後端串接]: 將 data.reply 改為 data.reply_summary
        content: data.reply_summary ?? data.reply,
        // TODO [後端串接]: 後端實作 reply_detail 後此處自動生效
        detailedContent: data.reply_detail,
        timestamp: new Date(),
        mode: answerType,
        queryDetails: {
          sqlJsonl: data.sql_jsonl,
          introContext: data.intro_context,
          sqlText: data.sql_text,
          gpdbParams: data.gpdb_params,
          gpdbResult: data.gpdb_result,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `抱歉，處理您的問題時發生錯誤：${err.message || "未知錯誤"}。請稍後再試。`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFaqClick = (question: string) => {
    setInputValue(question);
  };

  const hasAnyDetail = (details?: Message["queryDetails"]) => {
    if (!details) return false;
    return !!(details.sqlJsonl || details.introContext || details.sqlText || details.gpdbParams || details.gpdbResult);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── 左側欄 ── */}
      <aside
        className={`relative flex-shrink-0 flex flex-col border-r border-[var(--gold)]/20 bg-gradient-to-b from-[#2c3e50] via-[#34495e] to-[#2c3e50] text-white transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full w-72">
          {/* Header 區：標題 + 說明 */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wide">研究助理</h1>
                <p className="text-[11px] text-gray-400 leading-tight">Research Assistant</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              詢問關於典藏系統的問題、取得研究協助，或查找特定資料
            </p>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
          </div>

          {/* 常見問題 */}
          <div className="flex-1 overflow-y-auto px-5 pb-3">
            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 mb-2.5 flex items-center space-x-1.5">
              <MessageCircle className="w-3 h-3" />
              <span>常見問題</span>
            </h3>
            <div className="space-y-1.5">
              {FAQ_ITEMS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleFaqClick(q)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-xs leading-relaxed text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 回答模式說明（純展示，不可選取） */}
          {/* <div className="px-5 py-4 border-t border-white/10">
            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 mb-2.5">回答模式</h3>
            <div className="space-y-1.5">
              <div
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  answerType === "ans_summary"
                    ? "bg-[#16a085]/20 text-[#7ed5c5] ring-1 ring-[#16a085]/40"
                    : "text-gray-400"
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">統整式回答</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">僅查詢職名錄資料庫，回答速度較快，適合一般查詢</p>
                </div>
              </div>
              <div
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  answerType === "ans_with_gpdb"
                    ? "bg-[#d4af37]/15 text-[#e8d4a0] ring-1 ring-[#d4af37]/40"
                    : "text-gray-400"
                }`}
              >
                <Database className="w-3.5 h-3.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">整合官職資料庫回答</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">額外查詢政府官職系統資料庫，提供更完整歷史佐證</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </aside>

      {/* ── 右側主區域 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 頂部列：收合按鈕 + 標題 */}
        <div className="flex items-center h-12 px-4 border-b border-gray-200 bg-[var(--paper)] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md text-gray-500 hover:text-[var(--jade)] hover:bg-[var(--jade)]/10 transition-colors"
            title={sidebarOpen ? "收合側欄" : "展開側欄"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4.5 h-4.5" />
            ) : (
              <PanelLeftOpen className="w-4.5 h-4.5" />
            )}
          </button>
          <div className="ml-3 flex items-center space-x-2 seal-left">
            <Bot className="w-4.5 h-4.5 text-[var(--jade)]" />
            <span className="text-sm font-medium ink-text">典藏系統研究助理</span>
          </div>
        </div>

        {/* 對話訊息區 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full ink-scrollbar" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
              {messages.map((message) => {
                if (message.type === "modeSwitch" && message.mode) {
                  const meta = MODE_META[message.mode];
                  const Icon = meta.icon;
                  return (
                    <div key={message.id} className="flex items-center gap-3 py-2 select-none">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          color: meta.color,
                          backgroundColor: meta.tint,
                          boxShadow: `inset 0 0 0 1px ${meta.color}33`,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        <span>已切換至「{meta.label}」模式</span>
                        <span className="text-gray-400 font-normal">· 對話記憶已重置</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
                    </div>
                  );
                }
                return (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex space-x-3 max-w-[85%] ${
                      message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-[#e8d4a0] to-[#d4af37]"
                          : "bg-gradient-to-br from-[#7ed5c5] to-[#16a085]"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-[#2c3e50]" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-[#e8d4a0]/20 to-[#d4af37]/30 border border-[#d4af37]/30"
                            : "paper-card"
                        }`}
                        style={
                          message.mode === "ans_summary"
                            ? { borderLeftWidth: "4px", borderLeftColor: "#16a085" }
                            : message.mode === "ans_with_gpdb"
                            ? { borderLeftWidth: "4px", borderLeftColor: "#d4af37" }
                            : undefined
                        }
                      >
                        {/* 模式徽章（僅 assistant 且有模式資訊時顯示）
                        {message.mode && (
                          <div className="mb-2.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                message.mode === "ans_summary"
                                  ? "text-[#16a085] bg-[#16a085]/10 ring-1 ring-[#16a085]/25"
                                  : "text-[#96852a] bg-[#d4af37]/12 ring-1 ring-[#d4af37]/30"
                              }`}
                            >
                              {message.mode === "ans_summary" ? (
                                <>
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>統整式</span>
                                </>
                              ) : (
                                <>
                                  <Database className="w-2.5 h-2.5" />
                                  <span>官職資料庫</span>
                                </>
                              )}
                            </span>
                          </div>
                        )} */}

                        {/* 簡要回覆（預設顯示） */}
                        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {/* 詳細回覆（展開後顯示） */}
                        {message.detailedContent && (
                          <>
                            {expandedReplies.has(message.id) && (
                              <div className="mt-3 pt-3 border-t border-gray-200/60">
                                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                  {message.detailedContent}
                                </p>
                              </div>
                            )}
                            <button
                              onClick={() => toggleReply(message.id)}
                              className={`mt-2.5 flex items-center space-x-1.5 text-xs font-medium transition-colors ${
                                expandedReplies.has(message.id)
                                  ? "text-gray-400 hover:text-gray-600"
                                  : "text-[var(--jade)] hover:text-[#128c7e]"
                              }`}
                            >
                              {expandedReplies.has(message.id) ? (
                                <><ChevronsDownUp className="w-3.5 h-3.5" /><span>收合詳細回覆</span></>
                              ) : (
                                <><ChevronsUpDown className="w-3.5 h-3.5" /><span>查看詳細回覆</span></>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      {/* Query details collapsible */}
                      {hasAnyDetail(message.queryDetails) && (
                        <div className="mt-1">
                          <button
                            onClick={() => toggleDetails(message.id)}
                            className="text-xs text-[#16a085] hover:text-[#128c7e] flex items-center space-x-1"
                          >
                            {expandedDetails.has(message.id) ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            <span>查詢詳情</span>
                          </button>
                          {expandedDetails.has(message.id) && (
                            <div className="mt-2 p-3 bg-neutral-50 rounded text-xs font-mono text-neutral-600 max-h-64 overflow-auto whitespace-pre-wrap space-y-3">
                              {message.queryDetails!.sqlJsonl && (
                                <div>
                                  <p className="font-sans font-medium text-neutral-500 mb-1">SQL 資料庫搜尋結果：</p>
                                  <p>{message.queryDetails!.sqlJsonl}</p>
                                </div>
                              )}
                              {message.queryDetails!.introContext && (
                                <div>
                                  <p className="font-sans font-medium text-neutral-500 mb-1">屆次前言：</p>
                                  <p>{message.queryDetails!.introContext}</p>
                                </div>
                              )}
                              {message.queryDetails!.sqlText && (
                                <div>
                                  <p className="font-sans font-medium text-neutral-500 mb-1">SQL 原文：</p>
                                  <p>{message.queryDetails!.sqlText}</p>
                                </div>
                              )}
                              {message.queryDetails!.gpdbParams && (
                                <div>
                                  <p className="font-sans font-medium text-neutral-500 mb-1">政府公報搜尋參數：</p>
                                  <p>{message.queryDetails!.gpdbParams}</p>
                                </div>
                              )}
                              {message.queryDetails!.gpdbResult && (
                                <div>
                                  <p className="font-sans font-medium text-neutral-500 mb-1">政府公報搜尋結果：</p>
                                  <p>{message.queryDetails!.gpdbResult}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString("zh-TW")}
                      </p>
                    </div>
                  </div>
                </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="paper-card rounded-lg p-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 底部輸入區 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-[var(--paper)] px-4 py-3">
          <div className="max-w-3xl mx-auto space-y-1.5">
            {/* 輸入框（內嵌模式選擇器 + 送出按鈕） */}
            <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-[var(--jade)] focus-within:ring-1 focus-within:ring-[var(--jade)]/20 transition-colors">
              <input
                type="text"
                placeholder="輸入您的問題..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
              />

              {/* 模式選擇器 pill — 輸入框內靠右 */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setModelDropdownOpen((v) => !v)}
                  className={`flex items-center space-x-1 px-2 py-1 mr-1 rounded-md text-[11px] font-medium transition-colors ${
                    answerType === "ans_summary"
                      ? "text-[var(--jade)] bg-[var(--jade)]/8 hover:bg-[var(--jade)]/15"
                      : "text-[#96852a] bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20"
                  }`}
                >
                  {answerType === "ans_summary" ? (
                    <FileText className="w-3 h-3" />
                  ) : (
                    <Database className="w-3 h-3" />
                  )}
                  <span>{answerType === "ans_summary" ? "統整式" : "官職資料庫"}</span>
                  <ChevronDown className={`w-2.5 h-2.5 opacity-50 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {modelDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                    <button
                      onClick={() => selectMode("ans_summary")}
                      className={`w-full flex items-start space-x-3 px-4 py-3 text-left transition-colors ${
                        answerType === "ans_summary" ? "bg-[var(--jade)]/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium ink-text">統整式回答</span>
                          {answerType === "ans_summary" && <Check className="w-4 h-4 text-[var(--jade)]" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">使用中國國民黨職名錄資料庫，查詢速度較快</p>
                      </div>
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button
                      onClick={() => selectMode("ans_with_gpdb")}
                      className={`w-full flex items-start space-x-3 px-4 py-3 text-left transition-colors ${
                        answerType === "ans_with_gpdb" ? "bg-[var(--gold)]/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e8d4a0] to-[#d4af37] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Database className="w-3.5 h-3.5 text-[#2c3e50]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium ink-text">整合官職資料庫回答</span>
                          {answerType === "ans_with_gpdb" && <Check className="w-4 h-4 text-[var(--gold)]" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">額外查詢政府官職系統，提供更完整歷史佐證</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 送出按鈕 */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="flex-shrink-0 p-2 mr-1 rounded-md text-white bg-[var(--ink-dark)] hover:bg-[var(--ink-medium)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              本系統僅供參考，資料可能有誤，使用前請自行評估並承擔風險。
            </p>
          </div>
        </div>
      </div>

      {/* 切換模式確認對話框 */}
      {pendingMode && (() => {
        const meta = MODE_META[pendingMode];
        const Icon = meta.icon;
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-in fade-in duration-150"
            style={{ backgroundColor: "rgba(44, 62, 80, 0.42)", backdropFilter: "blur(4px)" }}
            onClick={cancelModeSwitch}
          >
            <div
              className="paper-card rounded-xl w-full max-w-sm p-6 relative"
              style={{ boxShadow: "0 20px 60px rgba(44, 62, 80, 0.25), 0 4px 12px rgba(44, 62, 80, 0.1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 頂部色條 */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                style={{ background: `linear-gradient(to right, transparent, ${meta.color}, transparent)` }}
              />

              <div className="flex items-start space-x-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.tint, color: meta.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-base font-medium ink-text">切換回覆模式</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Switch reply mode</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-5">
                即將切換至「<span style={{ color: meta.color, fontWeight: 500 }}>{meta.label}</span>」模式。
                <br />
                切換後，助理的<span className="font-medium">對話記憶將重置</span>，不會保留先前問答的上下文記憶。
              </p>

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={cancelModeSwitch}
                  className="px-4 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmModeSwitch}
                  className="px-4 py-1.5 rounded-md text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{
                    backgroundColor: meta.color,
                    boxShadow: `0 2px 8px ${meta.color}40`,
                  }}
                >
                  確認切換
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
