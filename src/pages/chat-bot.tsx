import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, ChevronDown, ChevronUp, Database, FileText,
  PanelLeftClose, PanelLeftOpen, MessageCircle, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatbotQuery } from "@/services/api";

type AnswerType = "ans_summary" | "ans_with_gpdb";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  queryDetails?: {
    sqlJsonl?: string;
    introContext?: string;
    sqlText?: string;
    gpdbParams?: string;
    gpdbResult?: string;
  };
}

const FAQ_ITEMS = [
  "如何搜尋特定時期的職務資料？",
  "請說明典藏系統收錄的資料範圍",
  "組織沿革頁面有哪些內容？",
  "如何正確引用典藏資料？",
  "可以依職位或單位搜尋嗎？",
];

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
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
    setAnswerType(mode);
    setModelDropdownOpen(false);
  }, []);

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

    try {
      const data = await chatbotQuery(query, answerType);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
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
          <div className="px-5 py-4 border-t border-white/10">
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
          </div>
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
              {messages.map((message) => (
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
                      >
                        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                          {message.content}
                        </p>
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
              ))}
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
                        <p className="text-xs text-gray-500 mt-0.5">查詢職名錄資料庫，速度較快</p>
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
    </div>
  );
}
