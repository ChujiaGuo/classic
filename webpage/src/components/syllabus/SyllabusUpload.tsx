"use client";

import { useRef, useState } from "react";

export default function SyllabusUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/parse`,
                { method: "POST", credentials: "include", body: formData }
            );

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Parse failed");
            } else {
                setResult(JSON.stringify(data, null, 2));
            }
        } catch {
            setError("Request failed — is the gateway running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Upload Syllabus</h2>

            <div className="flex gap-3 items-center">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.txt"
                    className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                    onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null);
                        setResult(null);
                        setError(null);
                    }}
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="px-4 py-1.5 rounded bg-neutral-800 text-white text-sm disabled:opacity-40 hover:bg-neutral-700 transition-colors whitespace-nowrap"
                >
                    {loading ? "Parsing…" : "Parse"}
                </button>
            </div>

            {loading && (
                <p className="text-sm text-neutral-500 animate-pulse">
                    Sending to LLM — this may take up to a minute for long syllabi…
                </p>
            )}

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {result && (
                <pre className="w-full overflow-auto rounded border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-800 max-h-[60vh]">
                    {result}
                </pre>
            )}
        </div>
    );
}
