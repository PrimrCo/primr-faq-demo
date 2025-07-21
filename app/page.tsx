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

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);
    if (data.success) {
      setMessage("File uploaded and parsed successfully!");
      setParsedText(data.parsedText || "");
    } else {
      setMessage(data.error || "Upload failed.");
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

  if (status === "loading") return <div>Loading...</div>;
  if (!session)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--brand-bg)]">
        <img src="/images/logo-v1.jpg" alt="Primr Logo" className="w-32 mb-6 rounded-xl shadow" />
        <h1 className="text-2xl mb-4 font-bold text-[var(--brand-red)]">Sign in to upload your FAQ docs</h1>
        <button
          className="bg-[var(--brand-blue)] text-white px-4 py-2 rounded font-semibold"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--brand-bg)]">
      <img src="/images/logo-v1.jpg" alt="Primr Logo" className="w-32 mb-6 rounded-xl shadow" />
      <h1 className="text-2xl mb-4 font-bold text-[var(--brand-red)]">Upload your FAQ document</h1>
      <input
        type="file"
        accept=".md,.txt,.pdf,.docx,.csv,.xlsx"
        onChange={handleFileChange}
        className="mb-2"
      />
      <button
        className="bg-[var(--brand-blue)] text-white px-4 py-2 rounded font-semibold"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <div className="mt-2 text-[var(--brand-red)]">{message}</div>}
      {parsedText && (
        <div className="mt-4 w-full max-w-xl bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-2 text-[var(--brand-blue)]">Parsed Text:</h2>
          <pre className="whitespace-pre-wrap text-[var(--brand-text)]">{parsedText}</pre>
        </div>
      )}

      {/* Q&A Form */}
      <div className="mt-8 w-full max-w-xl bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2 text-[var(--brand-blue)]">Ask a Question</h2>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Type your question..."
          className="w-full border border-[var(--brand-blue)] rounded px-2 py-1 mb-2"
        />
        <button
          className="bg-[var(--brand-yellow)] text-[var(--brand-text)] px-4 py-2 rounded font-semibold"
          onClick={handleAsk}
          disabled={asking}
        >
          {asking ? "Asking..." : "Ask"}
        </button>
        {answer && (
          <div className="mt-4">
            <h3 className="font-bold text-[var(--brand-red)]">Answer:</h3>
            <div className="text-[var(--brand-text)]">{answer}</div>
          </div>
        )}
      </div>

      <button
        className="mt-8 text-sm underline text-[var(--brand-blue)]"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </div>
  );
}