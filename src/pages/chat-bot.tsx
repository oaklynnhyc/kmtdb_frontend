import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronDown, ChevronUp, Database, FileText } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleDetails = (messageId: string) => {
    setExpandedDetails(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
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
        content: `抱歉，處理您的問題時發生錯誤：${err.message || '未知錯誤'}。請稍後再試。`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const hasAnyDetail = (details?: Message["queryDetails"]) => {
    if (!details) return false;
    return !!(details.sqlJsonl || details.introContext || details.sqlText || details.gpdbParams || details.gpdbResult);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="ink-header text-white py-16 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl mb-3 brush-title">
            研究助理
          </h1>
          <p className="text-gray-200 text-lg">
            詢問關於典藏系統的問題、取得研究協助，或查找特定資料
          </p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 對話區域 */}
          <div
            className="lg:col-span-3 paper-card rounded-lg seal-corner flex flex-col"
            style={{ height: "100vh" }}
          >
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 seal-left">
                  <Bot className="w-6 h-6 text-[#16a085]" />
                  <h2 className="text-lg font-medium ink-text">
                    典藏系統研究助理
                  </h2>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 p-6">
              <div className="flex-1 overflow-hidden mb-4">
                <ScrollArea className="h-full pr-4 ink-scrollbar">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex space-x-3 max-w-[80%] ${
                            message.role === "user"
                              ? "flex-row-reverse space-x-reverse"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === "user"
                                ? "bg-gradient-to-br from-[#e8d4a0] to-[#d4af37]"
                                : "bg-gradient-to-br from-[#7ed5c5] to-[#16a085]"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="w-5 h-5 text-[#2c3e50]" />
                            ) : (
                              <Bot className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7ed5c5] to-[#16a085] flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="paper-card rounded-lg p-4">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <div
                                className="w-2 h-2 bg-[#16a085] rounded-full animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* 回答模式選擇器 + 輸入框 */}
              <div className="flex-shrink-0 space-y-2">
                {/* 回答模式選擇 */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">回答模式：</span>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setAnswerType("ans_summary")}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs transition-all ${
                        answerType === "ans_summary"
                          ? "bg-[#16a085] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>統整式回答</span>
                    </button>
                    <button
                      onClick={() => setAnswerType("ans_with_gpdb")}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs transition-all border-l border-gray-200 ${
                        answerType === "ans_with_gpdb"
                          ? "bg-[#16a085] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      <span>整合官職資料庫回答</span>
                    </button>
                  </div>
                </div>

                {/* 輸入框 */}
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="輸入您的問題..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 paper-input"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="ink-button px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* 免責聲明 */}
                <p className="text-xs text-gray-500 text-center px-2">
                  本系統僅供參考，資料可能有誤，使用前請自行評估並承擔風險。
                </p>
              </div>
            </div>
          </div>

          {/* 側欄建議問題 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 模式說明 */}
            <div className="paper-card rounded-lg ink-border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-base font-medium ink-text seal-left">
                  回答模式說明
                </h2>
              </div>
              <div className="p-6 space-y-4 text-sm text-gray-600">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-[#16a085]" />
                    <span className="font-medium ink-text">統整式回答</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    僅查詢職名錄資料庫，回答速度較快，適合一般查詢需求。
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Database className="w-4 h-4 text-[#d4af37]" />
                    <span className="font-medium ink-text">整合官職資料庫回答</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    額外查詢政府官職系統資料庫，提供更完整的歷史佐證資料。
                  </p>
                </div>
              </div>
            </div>

            {/* 常見問題 */}
            <div className="paper-card rounded-lg ink-border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-base font-medium ink-text seal-left">
                  常見問題
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => setInputValue("中央執行委員會有哪些職位？")}
                    className="w-full text-left p-3 paper-card-hover rounded text-sm transition-all border border-transparent hover:border-[#16a085]/20"
                  >
                    中央執行委員會有哪些職位？
                  </button>
                  <button
                    onClick={() => setInputValue("第一屆中央執行委員有哪些人？")}
                    className="w-full text-left p-3 paper-card-hover rounded text-sm transition-all border border-transparent hover:border-[#16a085]/20"
                  >
                    第一屆中央執行委員有哪些人？
                  </button>
                  <button
                    onClick={() => setInputValue("蔣中正擔任過哪些職務？")}
                    className="w-full text-left p-3 paper-card-hover rounded text-sm transition-all border border-transparent hover:border-[#16a085]/20"
                  >
                    蔣中正擔任過哪些職務？
                  </button>
                  <button
                    onClick={() => setInputValue("請說明典藏系統收錄的資料範圍")}
                    className="w-full text-left p-3 paper-card-hover rounded text-sm transition-all border border-transparent hover:border-[#16a085]/20"
                  >
                    請說明典藏系統收錄的資料範圍
                  </button>
                  <button
                    onClick={() => setInputValue("如何正確引用典藏資料？")}
                    className="w-full text-left p-3 paper-card-hover rounded text-sm transition-all border border-transparent hover:border-[#16a085]/20"
                  >
                    如何正確引用典藏資料？
                  </button>
                  <button
                    onClick={() => setInputValue("孫中山在職名錄中有哪些紀錄？")}
                    className="w-full text-left p-3 paper-card-hover rounded text-sm transition-all border border-transparent hover:border-[#16a085]/20"
                  >
                    孫中山在職名錄中有哪些紀錄？
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
