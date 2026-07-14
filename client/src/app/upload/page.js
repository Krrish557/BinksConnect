"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { apiClient } from "@/services/apiClient";

export default function UploadPage() {
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = useCallback((fileList) => {
        const newFiles = Array.from(fileList).map((f) => ({
            file: f,
            name: f.name,
            size: f.size,
            status: "pending",
        }));
        setFiles((prev) => [...prev, ...newFiles]);
        setResults(null);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setResults(null);

        try {
            const formData = new FormData();
            files.forEach((f) => formData.append("files", f.file));

            const res = await fetch(`${apiClient._token ? "" : ""}/api/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiClient.getToken()}`,
                },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setResults(data);
            setFiles([]);
        } catch (err) {
            setResults({ error: err.message });
        } finally {
            setUploading(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <main className="px-6 pt-8 pb-10 max-w-3xl">
            <h1 className="text-3xl font-bold text-white mb-2">Upload Music</h1>
            <p className="text-[#B3B3B3] text-sm mb-8">
                Upload audio files to your Telegram storage. Metadata is extracted automatically from ID3 tags.
            </p>

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    dragOver
                        ? "border-[#1db954] bg-[#1db954]/10"
                        : "border-[#383838] hover:border-[#B3B3B3]"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />
                <p className="text-4xl mb-3">🎵</p>
                <p className="text-white font-semibold">
                    {dragOver ? "Drop files here" : "Drag & drop audio files"}
                </p>
                <p className="text-[#B3B3B3] text-sm mt-1">
                    or click to browse • MP3, FLAC, OGG, WAV, AAC, M4A • Max 20MB each
                </p>
            </div>

            {files.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white">{files.length} file(s) queued</h2>
                        <button
                            onClick={uploadFiles}
                            disabled={uploading}
                            className="bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold px-6 py-2 rounded-full transition-colors text-sm"
                        >
                            {uploading ? "Uploading..." : "Upload All"}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-[#181818] rounded-lg px-4 py-3">
                                <span className="text-[#B3B3B3]">🎵</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm truncate">{f.name}</p>
                                    <p className="text-[#B3B3B3] text-xs">{formatSize(f.size)}</p>
                                </div>
                                <button
                                    onClick={() => removeFile(i)}
                                    className="text-[#B3B3B3] hover:text-red-400 text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results && (
                <div className="mt-6">
                    {results.error ? (
                        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                            {results.error}
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-lg font-bold text-white mb-3">Upload Results</h2>
                            {results.summary && (
                                <div className="flex gap-4 mb-3 text-sm">
                                    <span className="text-green-400">{results.summary.successful} uploaded</span>
                                    <span className="text-yellow-400">{results.summary.duplicates} duplicates</span>
                                    <span className="text-red-400">{results.summary.failed} failed</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                {results.results?.map((r, i) => (
                                    <div key={i} className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                                        r.success ? "bg-[#1a3a27]" : "bg-red-900/20"
                                    }`}>
                                        <span>{r.success ? "✓" : "✕"}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm truncate">{r.fileName}</p>
                                            {r.duplicate && <p className="text-yellow-400 text-xs">Duplicate — already exists</p>}
                                            {r.trackId && !r.duplicate && <p className="text-green-400 text-xs">Track ID: {r.trackId}</p>}
                                            {r.error && <p className="text-red-400 text-xs">{r.error}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
