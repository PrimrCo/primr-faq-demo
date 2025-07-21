"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedText, setParsedText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setParsedText("");
    setAnswer("");
  };

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a file.");
    setUploading(true);
    setMessage("");
    setParsedText("");
    setAnswer("");
    const formData = new FormData();
    formData.append("file", file);

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
        } catch {
          // If response is not JSON, keep default errorMsg
        }
        setMessage(errorMsg);
        setUploading(false);
        return; // Cancel further processing
      }

      const data = await res.json();
      setUploading(false);
      if (data.success) {
        setMessage("File uploaded and parsed successfully!");
        setParsedText(data.parsedText || "");
      } else {
        setMessage(data.error || "Upload failed.");
      }
    } catch (err) {
      setUploading(false);
      setMessage("Network error or server unavailable.");
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAsking(false);
    setAnswer(data.answer || "No answer found.");
  };

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
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {message && <div className="mt-4 w-full text-center text-[var(--brand-red)] font-medium">{message}</div>}
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
              placeholder="Type your question..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] transition"
            />
            <button
              className="w-full bg-[var(--brand-yellow)] hover:bg-yellow-400 transition text-[var(--brand-text)] py-2 rounded-lg font-semibold shadow disabled:opacity-60"
              onClick={handleAsk}
              disabled={asking}
            >
              {asking ? "Asking..." : "Ask"}
            </button>
          </div>
          {answer && (
            <div className="mt-6">
              <h3 className="font-bold text-[var(--brand-red)] mb-1">Answer</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-900 whitespace-pre-wrap">{answer}</div>
            </div>
          )}
        </div>
        <button
          className="mt-10 text-sm text-[var(--brand-blue)] underline hover:text-blue-700 transition"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}