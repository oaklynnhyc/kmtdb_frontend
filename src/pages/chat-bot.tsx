import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, ChevronDown, ChevronUp, Database, FileText,
  PanelLeftClose, PanelLeftOpen, MessageCircle, Check, ChevronsDownUp, ChevronsUpDown, Clock, AlertCircle,
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/ui/markdown";
import { chatbotQuery, chatbotClear, chatbotVerify } from "@/services/api";

type AnswerType = "ans_summary" | "ans_with_gpdb";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;            // 簡要回覆
  detailedContent?: string;   // 詳細回覆
  timestamp: Date;
  mode?: AnswerType;          // 此則回覆所使用的回答模式（僅 assistant 訊息）
  type?: "modeSwitch" | "rateLimit" | "serviceError";  // 系統訊息類型（模式切換／達使用上限／服務異常通知）
  resetAt?: number;           // 限流通知用：可再次提問的 epoch 毫秒
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
  "請說明檢索系統收錄的資料範圍",
  "組織沿革頁面有哪些內容？",
  // 依 0601 修訂，移除「如何正確引用典藏資料？」此題（保留以備還原）
  // "如何正確引用典藏資料？",
  "可以依職位或單位搜尋嗎？",
];

// 等候回覆時輪播的狀態文字；依模式切換（官職資料庫模式多一段「檢索官職資料庫…」）
const TYPING_PHASES_DEFAULT = [
  "正在理解您的問題…",
  "檢索職名錄資料庫…",
  "彙整相關資料…",
  "整理回覆內容…",
];
const TYPING_PHASES_GPDB = [
  "正在理解您的問題…",
  "檢索職名錄資料庫…",
  "檢索官職資料庫…",
  "彙整相關資料…",
  "整理回覆內容…",
];
// 等候超時（比平均更久）時顯示的安撫語，避免畫面看起來卡死
const TYPING_PHASE_OVERTIME = "資料量較大，仍在處理…";

// A：滾動平均自學習——記錄最近 N 次「實際回應秒數」，據以推算輪播節奏
const REPLY_TIMES_KEY = "chatReplyDurationsMs";
const REPLY_TIMES_KEEP = 5;          // 只保留最近 5 次
const DEFAULT_REPLY_MS = 7000;       // 尚無紀錄時的預設估值
const PHASE_MIN_MS = 1000;           // 每段節奏下限 1 秒
const PHASE_MAX_MS = 4000;           // 每段節奏上限 4 秒

function readReplyTimes(): number[] {
  try {
    const arr = JSON.parse(localStorage.getItem(REPLY_TIMES_KEY) || "[]");
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number" && n > 0) : [];
  } catch {
    return [];
  }
}

function recordReplyTime(ms: number) {
  try {
    const arr = readReplyTimes();
    arr.push(ms);
    while (arr.length > REPLY_TIMES_KEEP) arr.shift();
    localStorage.setItem(REPLY_TIMES_KEY, JSON.stringify(arr));
  } catch {
    /* localStorage 不可用時忽略 */
  }
}

// 依最近回應的平均時間，算出每段輪播文字該停留多久（夾在 1~4 秒）
function computePhaseInterval(phaseCount: number): number {
  const arr = readReplyTimes();
  const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : DEFAULT_REPLY_MS;
  return Math.min(PHASE_MAX_MS, Math.max(PHASE_MIN_MS, avg / phaseCount));
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "您好，歡迎使用中國國民黨職名錄檢索系統AI深度探索。我可以協助您查詢職名錄資料庫、解答關於職名錄資料的疑問、提供歷史背景說明，以及協助您的研究工作。請問有什麼可以為您服務的嗎？",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingPhase, setTypingPhase] = useState(0);
  const [answerType, setAnswerType] = useState<AnswerType>("ans_summary");
  // 限流：rateLimitUntil 為可再次提問的 epoch 毫秒；nowTs 每秒更新以驅動倒數
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  // Turnstile：sitekey 沒設（本機無 captcha）就視為已通過，不擋開發
  const captchaEnabled = !!import.meta.env.VITE_TURNSTILE_SITEKEY;
  const [captchaOk, setCaptchaOk] = useState(!captchaEnabled);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<AnswerType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUserMessage = messages.some((m) => m.role === "user");

  // Reset backend session memory when component mounts (page load / refresh)
  useEffect(() => {
    chatbotClear().catch(() => {});
  }, []);

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
    chatbotClear().catch(() => {});
  }, [pendingMode]);

  const cancelModeSwitch = useCallback(() => setPendingMode(null), []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 等候回覆時推進輪播狀態文字：
  //  A 節奏依「最近回應平均時間」自適應（每段 1~4 秒）；
  //  B 末尾多一句超時安撫語，比平均更久時才出現，避免看起來卡死（停在該句、不循環）。
  const typingPhases = answerType === "ans_with_gpdb" ? TYPING_PHASES_GPDB : TYPING_PHASES_DEFAULT;
  const phaseSequence = [...typingPhases, TYPING_PHASE_OVERTIME];
  useEffect(() => {
    if (!isTyping) { setTypingPhase(0); return; }
    setTypingPhase(0);
    // 節奏 = 平均回應時間 ÷ 基本階段數，使基本階段大致在答案到達時走完
    const interval = computePhaseInterval(typingPhases.length);
    const lastIndex = typingPhases.length; // 含超時安撫語的最後一格
    const id = setInterval(() => {
      setTypingPhase((p) => Math.min(p + 1, lastIndex));
    }, interval);
    return () => clearInterval(id);
  }, [isTyping, answerType, typingPhases.length]);

  // 限流倒數：每秒更新 nowTs，倒數歸零時自動解除限流
  useEffect(() => {
    if (rateLimitUntil == null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNowTs(t);
      if (t >= rateLimitUntil) setRateLimitUntil(null);
    }, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  const isRateLimited = rateLimitUntil != null && nowTs < rateLimitUntil;
  // 格式化剩餘時間為 mm:ss
  const formatRemaining = (untilMs: number) => {
    const ms = Math.max(0, untilMs - nowTs);
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

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
    if (!inputValue.trim() || isTyping || isRateLimited || !captchaOk) return;

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
    const startedAt = performance.now();

    // Auto-collapse sidebar on first user message
    if (!hasUserMessage) setSidebarOpen(false);

    try {
      const data = await chatbotQuery(query, answerType);
      // 需人機驗證（session 過期）：重新顯示 widget
      if (data.captcha_required) {
        setCaptchaOk(false);
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "請先完成人機驗證後再提問。",
          timestamp: new Date(),
          type: "serviceError",
        }]);
        return;
      }
      // 達使用上限：顯示限額通知卡並啟動倒數（不計入回應時間統計）
      if (data.rate_limited) {
        const resetAt = Date.now() + (data.retry_after ?? 0) * 1000;
        setRateLimitUntil(resetAt);
        setNowTs(Date.now());
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.brief_reply,
          timestamp: new Date(),
          type: "rateLimit",
          resetAt,
        }]);
        return;
      }
      recordReplyTime(performance.now() - startedAt);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.brief_reply,
        detailedContent: data.reply,
        timestamp: new Date(),
        mode: answerType,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      // 真實錯誤只記給工程除錯，對使用者一律顯示友善訊息（不外洩 HTML／狀態碼／例外內容）
      console.error("Chatbot 請求失敗：", err);
      const isNetworkError =
        err instanceof TypeError || /fetch|network|failed to fetch/i.test(err?.message || "");
      const friendly =
        err?.name === "AuthError"
          ? "登入狀態已失效，請重新登入後再使用AI深度探索。"
          : isNetworkError
            ? "目前無法連線到伺服器，請稍候再試。"
            : "AI深度探索暫時無法使用，請稍後再試。";
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: friendly,
        timestamp: new Date(),
        type: "serviceError",
      }]);
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
    <div className="flex h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden relative">
      {/* ── 左側欄 ── */}
      {/* 行動裝置：覆蓋式側欄 + 背景遮罩 */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`flex-shrink-0 flex flex-col border-r border-[var(--gold)]/20 bg-gradient-to-b from-[#2c3e50] via-[#34495e] to-[#2c3e50] text-white transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? "w-72" : "w-0"
        } ${sidebarOpen ? "fixed inset-y-0 left-0 z-40 top-14 sm:top-16 lg:relative lg:top-0 lg:z-auto" : "relative"}`}
      >
        <div className="flex flex-col h-full w-72">
          {/* Header 區：標題 + 說明 */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wide">AI深度探索</h1>
                <p className="text-[11px] text-gray-400 leading-tight">Research Assistant</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              詢問關於檢索系統的問題、取得研究協助，或查找特定資料
            </p>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
          </div>

          {/* 常見問題 */}
          <div className="flex-1 overflow-y-auto px-5 pb-3">
            <h3 className="text-[11px] uppercase tracking-widest text-gray-400 mb-2.5 flex items-center space-x-1.5">
              <MessageCircle className="w-3 h-3" />
              <span>新手上路</span>
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
            {/* <span className="text-sm font-medium ink-text">檢索系統AI深度探索</span> */}
          </div>
        </div>

        {/* 對話訊息區 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full ink-scrollbar" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
              {messages.map((message) => {
                if (message.type === "rateLimit") {
                  const stillLimited = message.resetAt != null && nowTs < message.resetAt;
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="flex space-x-3 max-w-[85%]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e8d4a0] to-[#d4af37] flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-[#2c3e50]" />
                        </div>
                        <div
                          className="paper-card rounded-lg p-4 border-l-2 border-[#d4af37]"
                          style={{ backgroundColor: "rgba(212, 175, 55, 0.06)" }}
                        >
                          <p className="text-sm font-medium ink-text mb-1">已達使用上限</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{message.content}</p>
                          {message.resetAt != null && (
                            <div className="mt-2 flex items-center gap-1.5 text-sm">
                              <Clock className="w-3.5 h-3.5 text-[#96852a]" />
                              {stillLimited ? (
                                <span className="text-[#96852a]">
                                  可於 <span className="font-mono font-medium">{formatRemaining(message.resetAt)}</span> 後再次提問
                                </span>
                              ) : (
                                <span className="text-[var(--jade)]">現在可以再次提問了</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (message.type === "serviceError") {
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="flex space-x-3 max-w-[85%]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                        </div>
                        <div
                          className="paper-card rounded-lg p-4 border-l-2 border-gray-300"
                          style={{ backgroundColor: "rgba(100, 116, 139, 0.06)" }}
                        >
                          <p className="text-sm font-medium ink-text mb-1">服務暫時無法使用</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
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
                        {message.role === "assistant" ? (
                          <Markdown>{message.content}</Markdown>
                        ) : (
                          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}

                        {/* 詳細回覆（展開後顯示） */}
                        {message.detailedContent && (
                          <>
                            {expandedReplies.has(message.id) && (
                              <div className="mt-3 pt-3 border-t border-gray-200/60">
                                <Markdown>{message.detailedContent}</Markdown>
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
                    <div className="paper-card rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                        </div>
                        <span key={typingPhase} className="text-sm text-gray-500 animate-in fade-in duration-300">
                          {phaseSequence[typingPhase]}
                        </span>
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
            {/* 人機驗證：未通過前顯示 widget、鎖住輸入 */}
            {captchaEnabled && !captchaOk && (
              <div className="flex justify-center py-1">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITEKEY}
                  onSuccess={async (token) => {
                    try {
                      await chatbotVerify(token);
                      setCaptchaOk(true);
                    } catch {
                      setCaptchaOk(false);  // 驗證失敗，維持鎖定，widget 可重試
                    }
                  }}
                />
              </div>
            )}
            {/* 輸入框（內嵌模式選擇器 + 送出按鈕） */}
            <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-[var(--jade)] focus-within:ring-1 focus-within:ring-[var(--jade)]/20 transition-colors">
              <input
                type="text"
                placeholder={
                  !captchaOk
                    ? "請先完成上方人機驗證"
                    : isRateLimited && rateLimitUntil != null
                      ? `已達使用上限，可於 ${formatRemaining(rateLimitUntil)} 後再試`
                      : "輸入您的問題..."
                }
                value={inputValue}
                disabled={isRateLimited || !captchaOk}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none disabled:cursor-not-allowed"
              />

              {/* 模式選擇器 pill — 輸入框內靠右 */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => !isTyping && setModelDropdownOpen((v) => !v)}
                  disabled={isTyping}
                  className={`flex items-center space-x-1 px-2 py-1 mr-1 rounded-md text-[11px] font-medium transition-colors ${
                    isTyping
                      ? "opacity-40 cursor-not-allowed"
                      : answerType === "ans_summary"
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
                  <div className="absolute bottom-full right-0 mb-2 w-64 sm:w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
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
                disabled={!inputValue.trim() || isTyping || isRateLimited || !captchaOk}
                className="flex-shrink-0 p-2 mr-1 rounded-md text-white bg-[var(--ink-dark)] hover:bg-[var(--ink-medium)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              本AI深度探索為AI生成資訊，詢答結果僅供參考。
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
