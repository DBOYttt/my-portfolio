"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setSuccess("");
    setUploading(true);

    let uploaded = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        uploaded++;
      } else {
        const data = await res.json();
        setError(data.error ?? "Upload failed");
      }
    }

    setUploading(false);
    if (uploaded > 0) {
      setSuccess(`${uploaded} file${uploaded !== 1 ? "s" : ""} uploaded`);
      router.refresh();
      // Clear success message after 3s
      setTimeout(() => setSuccess(""), 3000);
    }

    // Reset file input
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-primary text-sm"
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-slate-600 text-xs font-mono">
          JPEG, PNG, WebP, GIF · max 5 MB
        </p>
        {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        {success && (
          <p className="text-green-400 text-xs font-mono">{success}</p>
        )}
      </div>
    </div>
  );
}
