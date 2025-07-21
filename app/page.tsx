"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedText, setParsedText] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setParsedText("");
  };

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a file.");
    setUploading(true);
    setMessage("");
    setParsedText("");
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

  if (status === "loading") return <div>Loading...</div>;
  if (!session)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-4">Sign in to upload your FAQ docs</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Upload your FAQ document</h1>
      <input
        type="file"
        accept=".md,.txt,.pdf,.docx,.csv,.xlsx"
        onChange={handleFileChange}
        className="mb-2"
      />
      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <div className="mt-2 text-yellow-700">{message}</div>}
      {parsedText && (
        <div className="mt-4 w-full max-w-xl bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Parsed Text:</h2>
          <pre className="whitespace-pre-wrap">{parsedText}</pre>
        </div>
      )}
      <button
        className="mt-8 text-sm underline"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
