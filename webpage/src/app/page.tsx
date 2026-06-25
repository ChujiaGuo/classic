import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
    const cookieStore = await cookies();
    if (cookieStore.get("session")?.value) redirect("/dashboard");

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <header className="h-14 border-b border-neutral-200 bg-white flex items-center px-8 gap-4 shrink-0">
                <span className="font-semibold text-neutral-900 tracking-tight">Classic</span>
                <div className="flex-1" />
                <Link
                    href="/login"
                    className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                    Log in
                </Link>
                <Link
                    href="/login"
                    className="text-sm bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                    Get started
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
                <div className="max-w-lg flex flex-col gap-6">
                    <h1 className="text-4xl font-bold text-neutral-900 leading-tight tracking-tight">
                        Your syllabus,<br />organized instantly.
                    </h1>
                    <p className="text-base text-neutral-500 leading-relaxed">
                        Upload a syllabus PDF and Classic extracts your schedule, assignments,
                        and exams — ready to add to any calendar.
                    </p>
                    <div className="flex justify-center">
                        <Link
                            href="/login"
                            className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                        >
                            Get started for free
                        </Link>
                    </div>
                </div>

                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
                    {[
                        {
                            title: "Upload any syllabus",
                            body: "PDF or plain text — Classic handles both.",
                        },
                        {
                            title: "Structured in seconds",
                            body: "LLM-powered extraction pulls every date, exam, and assignment.",
                        },
                        {
                            title: "Export to calendar",
                            body: "Download a .ics file and import into Google, Apple, or Outlook.",
                        },
                    ].map((f) => (
                        <div
                            key={f.title}
                            className="rounded-xl border border-neutral-200 bg-white p-5 text-left flex flex-col gap-2"
                        >
                            <p className="text-sm font-semibold text-neutral-900">{f.title}</p>
                            <p className="text-xs text-neutral-500 leading-relaxed">{f.body}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
