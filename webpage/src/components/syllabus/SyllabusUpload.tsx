"use client";

import { useRef, useState } from "react";
import type { ParsedSyllabus } from "@/types/syllabus";
import SyllabusView from "./SyllabusView";

export default function SyllabusUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [syllabus, setSyllabus] = useState<ParsedSyllabus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setSyllabus(null);
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
                setSyllabus(data as ParsedSyllabus);
            }
        } catch {
            setError("Request failed — is the gateway running?");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSyllabus(null);
        setFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    if (syllabus) {
        return <SyllabusView syllabus={syllabus} onReset={reset} />;
    }

    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md flex flex-col gap-5 p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div>
                    <h2 className="text-base font-semibold text-neutral-900">Parse a syllabus</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Upload a PDF or text file and Classic will extract your schedule, assignments, and exams.
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.txt"
                    className="text-sm text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                    onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null);
                        setError(null);
                    }}
                />

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-neutral-700 transition-colors"
                >
                    {loading ? "Parsing…" : "Parse syllabus"}
                </button>

                {loading && (
                    <p className="text-xs text-neutral-400 text-center animate-pulse">
                        Sending to Parser — this may take a minute for large syllabi…
                    </p>
                )}

                {error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
            </div>
        </div>
    );
}
