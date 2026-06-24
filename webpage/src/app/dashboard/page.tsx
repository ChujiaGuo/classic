import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import SyllabusUpload from "@/components/syllabus/SyllabusUpload";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return redirect("/login");

    let user;
    try {
        const res = await fetch(`${process.env.API_GATEWAY_URL}/api/auth`, {
            method: "GET",
            headers: { cookie: `session=${session}` },
            cache: "no-store",
        });
        if (!res.ok) return redirect("/login");
        user = await res.json();
    } catch {
        return redirect("/");
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <header className="h-14 border-b border-neutral-200 bg-white flex items-center px-8 gap-4 shrink-0">
                <span className="font-semibold text-neutral-900 tracking-tight">Classic</span>
                <div className="flex-1" />
                <span className="text-sm text-neutral-500 hidden sm:block">{user.email}</span>
                <LogoutButton />
            </header>

            <main className="flex-1 flex flex-col px-8 py-10 w-full max-w-6xl mx-auto">
                <SyllabusUpload />
            </main>
        </div>
    );
}
