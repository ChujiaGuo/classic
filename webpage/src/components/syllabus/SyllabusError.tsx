"use client";

export default function SyllabusError({
    message,
    onReset,
}: {
    message: string;
    onReset: () => void;
}) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md flex flex-col gap-3 p-8 rounded-2xl border border-red-200 bg-white shadow-sm">
                <button
                    onClick={onReset}
                    aria-label="Dismiss"
                    className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors text-sm leading-none"
                >
                    ✕
                </button>

                <h2 className="text-base font-semibold text-neutral-900">Parsing failed</h2>
                <p className="text-sm text-neutral-500">
                    We couldn&apos;t extract schedule information from your syllabus.
                </p>
                {message && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
