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
        if (!res.ok) {
            return redirect("/login");
        }
        user = await res.json()
    } catch (err) {
        console.error(err)
        return redirect("/")
    }


    return (
        <div className="flex flex-col items-center p-8 gap-8">
            <div className="w-full max-w-2xl flex items-center justify-between">
                <h1 className="text-xl font-semibold">Welcome, {user.email}</h1>
                <LogoutButton />
            </div>
            <SyllabusUpload />
        </div>
    );
}
