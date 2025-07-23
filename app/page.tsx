"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import EventSelector from "../components/EventSelector";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [eventList, setEventList] = useState<PrimrEvent[]>([]);
  const [event, setEvent] = useState<PrimrEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PrimrEvent | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setParsedText("");
    setAnswer("");
  };

  const handleUpload = async () => {
    if (!file || !event?._id) return setMessage("Please select a file and event.");
    setUploading(true);
    setMessage("");
    setParsedText("");
    setAnswer("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", event._id);

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
    } catch (err) {
      setUploading(false);
      setMessage("Network error or server unavailable.");
      setMessageType("error");
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !event?._id) return;
    setAsking(true);
    setAnswer("");
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, eventId: event._id }),
    });
    const data = await res.json();
    setAsking(false);
    setAnswer(data.answer || "No answer found.");
  };

  const fetchChatHistory = async () => {
    if (!event?._id) return;
    setLoadingHistory(true);
    const res = await fetch(`/api/chat-history?eventId=${encodeURIComponent(event._id)}`);
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
    if (!event?._id) return;
    setLoadingFiles(true);
    const res = await fetch(`/api/files?eventId=${encodeURIComponent(event._id)}`);
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
    if (!event?._id) return;
    if (!window.confirm("Delete this file? This cannot be undone.")) return;
    await fetch(`/api/files?key=${encodeURIComponent(key)}&eventId=${encodeURIComponent(event._id)}`, { method: "DELETE" });
    fetchFiles();
    if (previewFile === key) {
      setPreview(null);
      setPreviewFile(null);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [event]);

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        setEventList(data.events || []);
        // Restore selected event from localStorage
        const savedId = localStorage.getItem("selectedEventId");
        if (savedId) {
          const found = (data.events || []).find((ev: any) => ev._id === savedId);
          if (found) {
            setSelectedEvent(found);
            setEvent(found);
          }
        }
      });
  }, []);

  useEffect(() => {
    if (!uploading && file === null) {
      fetchFiles();
    }
  }, [uploading, file]);

  useEffect(() => {
    if (!selectedEvent && !file) {
      setError("Please select a file and event.");
    } else if (!selectedEvent) {
      setError("Please select an event.");
    } else if (!file) {
      setError("Please select a file.");
    } else {
      setError("");
      // proceed with upload or Q&A
    }
  }, [selectedEvent, file]);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
  if (!session)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--brand-bg)] px-4">
        <img src="/images/logo-v1.jpg" alt="Primr Logo" className="w-28 h-28 mb-6 rounded-xl shadow-md object-contain" />
        <h1 className="text-3xl font-extrabold mb-2 text-[var(--brand-red)] tracking-tight">Primr FAQ Demo</h1>
        <p className="mb-6 text-gray-600 text-center max-w-md">Sign in with Google to upload your FAQ documents and ask questions powered by AI.</p>
        <button
          className="bg-[var(--brand-blue)] hover:bg-blue-700 transition text-white px-6 py-2 rounded-lg font-semibold shadow"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </div>
    );
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--brand-bg)] px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <img src="/images/logo-v1.jpg" alt="Primr Logo" className="w-20 h-20 mb-4 rounded-lg object-contain shadow" />
        <h1 className="text-2xl font-bold mb-1 text-[var(--brand-red)] tracking-tight">Upload your FAQ document</h1>
        <p className="mb-6 text-gray-500 text-center">Supported: .md, .txt, .pdf, .docx, .csv, .xlsx</p>

        {/* Event Selector Info Block */}
        <div className="w-full mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-[var(--brand-blue)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
            </svg>
            <span className="font-semibold text-[var(--brand-blue)] text-base">Select or Create an Event</span>
          </div>
          <div className="text-gray-600 text-sm mb-3">
            All uploads, questions, and files are grouped by event. <span className="font-medium text-gray-700">Select an event to continue.</span>
          </div>
          <EventSelector
            selectedEvent={selectedEvent}
            onSelect={(event: PrimrEvent | null) => {
              setSelectedEvent(event);
              setEvent(event);
              setMessage("");
              setError("");
              if (event) {
                localStorage.setItem("selectedEventId", event._id);
              } else {
                localStorage.removeItem("selectedEventId");
              }
            }}
          />
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="file"
            accept=".md,.txt,.pdf,.docx,.csv,.xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--brand-blue)] file:text-white hover:file:bg-blue-700 transition"
          />
          <button
            className="w-full bg-[var(--brand-blue)] hover:bg-blue-700 transition text-white py-2 rounded-lg font-semibold shadow disabled:opacity-60"
            onClick={handleUpload}
            disabled={uploading || !selectedEvent}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {message && (
          <div
            className={`mt-4 w-full text-center px-4 py-2 rounded-lg font-medium border shadow-sm
              ${messageType === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-[var(--brand-red)] border-red-200"
              }`}
          >
            {message}
          </div>
        )}
        {parsedText && (
          <div className="mt-8 w-full">
            <h2 className="font-semibold text-[var(--brand-blue)] mb-2">Parsed Text</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-auto">{parsedText}</div>
          </div>
        )}
        <div className="mt-10 w-full">
          <h2 className="font-semibold text-[var(--brand-blue)] mb-2">Ask a Question</h2>
          <div className="flex flex-col gap-2">
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
              placeholder="Type your question and press Enter…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] transition"
            />
            <button
              className="w-full bg-[var(--brand-yellow)] hover:bg-yellow-400 transition text-[var(--brand-text)] py-2 rounded-lg font-semibold shadow disabled:opacity-60"
              onClick={handleAsk}
              disabled={asking}
            >
              {asking ? "Asking..." : "Ask"}
            </button>
            <button
              className="mt-2 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg py-2 text-sm font-medium transition"
              style={{ fontWeight: 500 }}
              onClick={() => {
                fetchFiles();
                setShowFileModal(true);
              }}
            >
              Manage Files
            </button>
            <button
              className="mt-2 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg py-2 text-sm font-medium transition"
              style={{ fontWeight: 500 }}
              onClick={() => { setShowChatHistory(true); fetchChatHistory(); }}
            >
              View Chat History
            </button>
          </div>
          {answer && (
            <div className="mt-6">
              <h3 className="font-bold text-[var(--brand-red)] mb-1">Answer</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-900 whitespace-pre-wrap">{answer}</div>
            </div>
          )}
        </div>
        <div className="my-6 w-full text-gray-700 text-base">
          <p className="mb-2">
            <strong>How it works:</strong> Upload a document (
            <span className="font-mono">.md</span>, <span className="font-mono">.txt</span>, <span className="font-mono">.pdf</span>,{" "}
            <span className="font-mono">.docx</span>, <span className="font-mono">.csv</span>, <span className="font-mono">.xlsx</span>) and ask questions about its content. Our AI will read your file and answer based on what it finds.
          </p>
          <p className="mb-2">
            <strong>Tip:</strong> Try asking about specific policies, procedures, or details from your uploaded document.
          </p>
          <p className="mb-2">
            <strong>Privacy:</strong> Your files and questions are private to your Google account.
          </p>
          <p className="text-center text-sm text-gray-500">
            If upload fails, check that your file is under 10MB and in a supported format.
          </p>
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-semibold">Example questions:</span>
          <ul className="list-disc list-inside">
            <li>What is the refund policy?</li>
            <li>How do I reset my password?</li>
            <li>Who do I contact for support?</li>
          </ul>
        </div>
        <button
          className="mt-10 text-sm text-[var(--brand-blue)] underline hover:text-blue-700 transition"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      </div>

      {showChatHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowChatHistory(false)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Chat History</h2>
            {loadingHistory ? (
              <div>Loading...</div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-4">
                {chatHistory.length === 0 && <div className="text-gray-500">No chat history yet.</div>}
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className="border-b pb-2 leading-relaxed">
                    <div className="text-xs text-gray-400">{new Date(chat.timestamp).toLocaleString()}</div>
                    <div className="font-semibold">Q: {chat.question}</div>
                    <div className="text-gray-700">A: {chat.answer}</div>
                    <div className="text-xs text-gray-500 mt-1">Source: {chat.sourceFile}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs" onClick={clearChatHistory}>Clear History</button>
              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs" onClick={downloadChatHistory}>Download</button>
            </div>
          </div>
        </div>
      )}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowFileModal(false)}>✕</button>
            <h2 className="font-semibold text-[var(--brand-blue)] mb-4">Your Files</h2>
            {loadingFiles ? (
              <div>Loading files...</div>
            ) : files.length === 0 ? (
              <div className="text-gray-400 text-sm">No files uploaded yet.</div>
            ) : (
              <ul className="space-y-2">
                {files.map((file) => (
                  <li key={file.docKey}>
                    {file.originalFilename}
                    <div className="flex gap-2">
                      <button
                        className="text-[var(--brand-blue)] underline text-xs"
                        onClick={() => handlePreview(file.docKey)}
                      >
                        Preview
                      </button>
                      <button
                        className="text-red-600 underline text-xs"
                        onClick={() => handleDelete(file.docKey)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {preview && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setPreview(null)}>✕</button>
                  <h3 className="font-bold mb-2">Preview: {files.find(f => f.key === previewFile)?.name}</h3>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap max-h-80 overflow-auto">{preview}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}