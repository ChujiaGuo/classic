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
            <div className="w-full max-w-md flex flex-col gap-5 p-8 rounded-2xl border border-red-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-400 font-semibold text-sm select-none">
                        ✕
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900">Parsing failed</h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            We couldn&apos;t extract schedule information from your syllabus.
                        </p>
                    </div>
                    {message && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words">
                            {message}
                        </p>
                    )}
                </div>

                <button
                    onClick={onReset}
                    className="w-full py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
