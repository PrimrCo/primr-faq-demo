"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import EventSelector from "../components/EventSelector";
import { 
  DocumentArrowUpIcon, 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  ClockIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import type { PrimrEvent } from "../types/primr-event";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [parsedText, setParsedText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    timestamp: string;
    question: string;
    answer: string;
    sourceFile?: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [files, setFiles] = useState<Array<{docKey: string; originalFilename: string}>>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PrimrEvent | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setParsedText("");
    setAnswer("");
  };

  const handleUpload = async () => {
    if (!file || !selectedEvent?._id) return setMessage("Please select a file and event.");
    setUploading(true);
    setMessage("");
    setParsedText("");
    setAnswer("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", selectedEvent._id);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = "Upload failed.";
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        setMessage(errorMsg);
        setMessageType("error");
        setUploading(false);
        return;
      }

      const data = await res.json();
      setUploading(false);
      if (data.success) {
        setMessage("File uploaded and parsed successfully!");
        setMessageType("success");
        setParsedText(data.parsedText || "");
        fetchFiles();
      } else {
        setMessage(data.error || "Upload failed.");
        setMessageType("error");
      }
    } catch {
      setUploading(false);
      setMessage("Network error or server unavailable.");
      setMessageType("error");
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !selectedEvent?._id) return;
    setAsking(true);
    setAnswer("");
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, eventId: selectedEvent._id }),
    });
    const data = await res.json();
    setAsking(false);
    setAnswer(data.answer || "No answer found.");
  };

  const fetchChatHistory = async () => {
    if (!selectedEvent?._id) return;
    setLoadingHistory(true);
    const res = await fetch(`/api/chat-history?eventId=${encodeURIComponent(selectedEvent._id)}`);
    const data = await res.json();
    setChatHistory(data.chats || []);
    setLoadingHistory(false);
  };

  const clearChatHistory = async () => {
    await fetch("/api/chat-history", { method: "DELETE" });
    fetchChatHistory();
  };

  const downloadChatHistory = () => {
    window.open("/api/chat-history?download=1", "_blank");
  };

  const fetchFiles = async () => {
    if (!selectedEvent?._id) return;
    setLoadingFiles(true);
    const res = await fetch(`/api/files?eventId=${encodeURIComponent(selectedEvent._id)}`);
    const data = await res.json();
    setFiles(data.files || []);
    setLoadingFiles(false);
  };

  const handlePreview = async (key: string) => {
    setPreviewFile(key);
    setPreview("Loading...");
    const res = await fetch(`/api/files/preview?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    setPreview(data.preview || "No preview available.");
  };

  const handleDelete = async (key: string) => {
    if (!selectedEvent?._id) return;
    if (!window.confirm("Delete this file? This cannot be undone.")) return;
    await fetch(`/api/files?key=${encodeURIComponent(key)}&eventId=${encodeURIComponent(selectedEvent._id)}`, { method: "DELETE" });
    fetchFiles();
    if (previewFile === key) {
      setPreview(null);
      setPreviewFile(null);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedEvent]);

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        // Restore selected event from localStorage
        const savedId = localStorage.getItem("selectedEventId");
        if (savedId) {
          const found = (data.events || []).find((ev: PrimrEvent) => ev._id === savedId);
          if (found) {
            setSelectedEvent(found);
          }
        }
      });
  }, []);

  useEffect(() => {
    if (!uploading && file === null) {
      fetchFiles();
    }
  }, [uploading, file]);

  if (status === "loading") return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--brand-bg)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-blue)] mx-auto mb-4"></div>
        <p className="text-lg text-[var(--brand-gray)]">Loading your workspace...</p>
      </div>
    </div>
  );

  if (!session)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-bg)] to-white flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/images/logo-v1.jpg" alt="Primr Logo" className="w-10 h-10 rounded-lg object-contain" />
              <h1 className="text-xl font-bold text-[var(--brand-red)]">Primr Event Manager</h1>
            </div>
            <div className="text-sm text-[var(--brand-gray)]">Professional Event Documentation</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 bg-[var(--brand-light-blue)] rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarDaysIcon className="w-10 h-10 text-[var(--brand-blue)]" />
              </div>
              
              <h2 className="text-2xl font-bold text-[var(--brand-text)] mb-2">Welcome to Primr</h2>
              <p className="text-[var(--brand-gray)] mb-6 leading-relaxed">
                Streamline your event management with AI-powered document insights. 
                Perfect for event planners and marketing teams.
              </p>

              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-start space-x-3">
                  <DocumentArrowUpIcon className="w-5 h-5 text-[var(--brand-blue)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--brand-text)]">Upload Event Documents</p>
                    <p className="text-sm text-[var(--brand-gray)]">PDFs, Word docs, spreadsheets, and more</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-[var(--brand-blue)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--brand-text)]">Ask Questions Instantly</p>
                    <p className="text-sm text-[var(--brand-gray)]">Get AI-powered answers from your documents</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <UsersIcon className="w-5 h-5 text-[var(--brand-blue)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--brand-text)]">Manage Your Team</p>
                    <p className="text-sm text-[var(--brand-gray)]">Organize by events and keep everyone informed</p>
                  </div>
                </div>
              </div>

              <button
                className="w-full bg-[var(--brand-blue)] hover:bg-blue-700 transition-colors duration-200 text-white px-6 py-3 rounded-lg font-semibold shadow-lg flex items-center justify-center space-x-2"
                onClick={() => signIn("google")}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="mt-4 text-xs text-[var(--brand-gray)]">
                Secure authentication • Your data stays private
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  return (
    <div className="min-h-screen bg-[var(--brand-bg)]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/images/logo-v1.jpg" alt="Primr Logo" className="w-10 h-10 rounded-lg object-contain" />
              <div>
                <h1 className="text-xl font-bold text-[var(--brand-red)]">Primr Event Manager</h1>
                <p className="text-sm text-[var(--brand-gray)]">Professional Event Documentation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-[var(--brand-gray)]">
                <UserCircleIcon className="w-5 h-5" />
                <span>{session?.user?.name}</span>
              </div>
              <button
                className="flex items-center space-x-1 text-sm text-[var(--brand-gray)] hover:text-[var(--brand-blue)] transition-colors"
                onClick={() => signOut()}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Selection & Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Selection Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[var(--brand-light-blue)] rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="w-6 h-6 text-[var(--brand-blue)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--brand-text)]">Event Management</h2>
                  <p className="text-sm text-[var(--brand-gray)]">Select or create an event to organize your documents</p>
                </div>
              </div>
              
              <EventSelector
                selectedEvent={selectedEvent}
                onSelect={(event: PrimrEvent | null) => {
                  setSelectedEvent(event);
                  setMessage("");
                  if (event) {
                    localStorage.setItem("selectedEventId", event._id);
                  } else {
                    localStorage.removeItem("selectedEventId");
                  }
                }}
              />
            </div>

            {/* Document Upload Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[var(--brand-light-blue)] rounded-lg flex items-center justify-center">
                  <DocumentArrowUpIcon className="w-6 h-6 text-[var(--brand-blue)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--brand-text)]">Upload Documents</h2>
                  <p className="text-sm text-[var(--brand-gray)]">Add event materials for AI-powered assistance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[var(--brand-blue)] transition-colors">
                  <input
                    type="file"
                    accept=".md,.txt,.pdf,.docx,.csv,.xlsx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--brand-blue)] file:text-white hover:file:bg-blue-700 transition"
                  />
                  <div className="mt-2 text-xs text-[var(--brand-gray)]">
                    Supported formats: PDF, Word, Excel, Markdown, Text, CSV
                  </div>
                </div>

                <button
                  className="w-full bg-[var(--brand-blue)] hover:bg-blue-700 transition-colors duration-200 text-white py-3 rounded-lg font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  onClick={handleUpload}
                  disabled={uploading || !selectedEvent || !file}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="w-4 h-4" />
                      <span>Upload Document</span>
                    </>
                  )}
                </button>
              </div>

              {message && (
                <div
                  className={`mt-4 w-full px-4 py-3 rounded-lg font-medium border
                    ${messageType === "success"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-[var(--brand-red)] border-red-200"
                    }`}
                >
                  {message}
                </div>
              )}

              {parsedText && (
                <div className="mt-6">
                  <h3 className="font-semibold text-[var(--brand-blue)] mb-3">Document Preview</h3>
                  <div className="bg-[var(--brand-light-gray)] border border-gray-200 rounded-lg p-4 text-sm text-gray-800 max-h-48 overflow-y-auto">
                    {parsedText}
                  </div>
                </div>
              )}
            </div>

            {/* Q&A Interface Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[var(--brand-light-blue)] rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-[var(--brand-blue)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--brand-text)]">Ask Questions</h2>
                  <p className="text-sm text-[var(--brand-gray)]">Get instant answers from your event documents</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                    placeholder="Ask about your event documents..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent transition"
                    disabled={!selectedEvent}
                  />
                  <button
                    className="bg-[var(--brand-yellow)] hover:bg-yellow-400 transition-colors duration-200 text-[var(--brand-text)] px-6 py-3 rounded-lg font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAsk}
                    disabled={asking || !selectedEvent || !question.trim()}
                  >
                    {asking ? "..." : "Ask"}
                  </button>
                </div>

                {answer && (
                  <div className="bg-[var(--brand-light-blue)] border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-[var(--brand-blue)] mb-2 flex items-center space-x-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span>AI Response</span>
                    </h3>
                    <div className="text-[var(--brand-text)] leading-relaxed whitespace-pre-wrap">{answer}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    className="bg-[var(--brand-light-gray)] hover:bg-gray-200 text-[var(--brand-text)] border border-gray-200 rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    onClick={() => { setShowChatHistory(true); fetchChatHistory(); }}
                  >
                    <ClockIcon className="w-4 h-4" />
                    <span>View History</span>
                  </button>
                  <button
                    className="bg-[var(--brand-light-gray)] hover:bg-gray-200 text-[var(--brand-text)] border border-gray-200 rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    onClick={() => {
                      fetchFiles();
                      setShowFileModal(true);
                    }}
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span>Manage Files</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[var(--brand-text)] mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--brand-gray)]">Documents</span>
                  <span className="font-semibold text-[var(--brand-text)]">{files.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--brand-gray)]">Chat Messages</span>
                  <span className="font-semibold text-[var(--brand-text)]">{chatHistory.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--brand-gray)]">Current Event</span>
                  <span className="font-semibold text-[var(--brand-blue)] truncate max-w-24">
                    {selectedEvent?.name || "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-[var(--brand-light-blue)] to-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-[var(--brand-blue)] mb-3">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-[var(--brand-text)]">
                <li className="flex items-start space-x-2">
                  <span className="text-[var(--brand-blue)] mt-1">•</span>
                  <span>Upload event runsheets, vendor lists, and schedules for comprehensive coverage</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[var(--brand-blue)] mt-1">•</span>
                  <span>Ask specific questions like &ldquo;What time does catering arrive?&rdquo; for best results</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[var(--brand-blue)] mt-1">•</span>
                  <span>Create separate events for different projects to stay organized</span>
                </li>
              </ul>
            </div>

            {/* Sample Questions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-[var(--brand-text)] mb-3">Sample Questions</h3>
              <div className="space-y-2">
                {[
                  "What's the setup timeline?",
                  "Who are the key contacts?",
                  "What's the backup plan?",
                  "When is load-in scheduled?"
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(q)}
                    className="w-full text-left text-sm text-[var(--brand-gray)] hover:text-[var(--brand-blue)] hover:bg-[var(--brand-light-blue)] p-2 rounded transition-colors"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat History Modal */}
      {showChatHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[var(--brand-light-blue)] rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-[var(--brand-blue)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--brand-text)]">Chat History</h2>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" 
                onClick={() => setShowChatHistory(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-blue)]"></div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8 text-[var(--brand-gray)]">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No chat history yet.</p>
                  <p className="text-sm mt-1">Start asking questions about your documents!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-[var(--brand-gray)]">
                          {new Date(chat.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-[var(--brand-blue)] bg-[var(--brand-light-blue)] px-2 py-1 rounded">
                          {chat.sourceFile || 'Unknown source'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-[var(--brand-text)]">Q:</span>
                        <span className="ml-2 text-[var(--brand-text)]">{chat.question}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--brand-blue)]">A:</span>
                        <span className="ml-2 text-[var(--brand-gray)]">{chat.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button 
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors flex items-center space-x-2" 
                onClick={clearChatHistory}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear History</span>
              </button>
              <button 
                className="px-4 py-2 bg-[var(--brand-light-blue)] text-[var(--brand-blue)] rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors flex items-center space-x-2" 
                onClick={downloadChatHistory}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Management Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[var(--brand-light-blue)] rounded-lg flex items-center justify-center">
                  <FolderIcon className="w-5 h-5 text-[var(--brand-blue)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--brand-text)]">Document Library</h2>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" 
                onClick={() => setShowFileModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-blue)]"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-[var(--brand-gray)]">
                  <DocumentArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm mt-1">Upload your first document to get started!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {files.map((file) => (
                    <div key={file.docKey} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[var(--brand-light-blue)] rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-[var(--brand-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--brand-text)]">{file.originalFilename}</p>
                            <p className="text-xs text-[var(--brand-gray)]">Document</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 text-xs text-[var(--brand-blue)] bg-[var(--brand-light-blue)] rounded hover:bg-blue-100 transition-colors"
                            onClick={() => handlePreview(file.docKey)}
                          >
                            Preview
                          </button>
                          <button
                            className="px-3 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            onClick={() => handleDelete(file.docKey)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[var(--brand-text)]">
                Document Preview: {files.find(f => f.docKey === previewFile)?.originalFilename}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" 
                onClick={() => {setPreview(null); setPreviewFile(null);}}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[var(--brand-light-gray)] border border-gray-200 rounded-lg p-4 text-sm text-[var(--brand-text)] whitespace-pre-wrap font-mono leading-relaxed">
                {preview}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}