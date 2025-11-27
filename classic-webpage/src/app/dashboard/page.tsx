import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/auth/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) redirect("/login");

    let decoded;
    try {
        decoded = await verifySessionCookie(session);
    } catch {
        redirect("/login");
    }

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h1>Welcome, {decoded.email}</h1>
            <div className="mt-4">
                <LogoutButton />
            </div>
        </div>
    );
}
