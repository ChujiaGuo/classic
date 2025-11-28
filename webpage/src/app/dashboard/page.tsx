import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return redirect("/login");

    let user;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth`, {
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
        <div className="flex flex-col items-center justify-center p-8">
            <h1>Welcome, {user.email}</h1>
            <div className="mt-4">
                <LogoutButton />
            </div>
        </div>
    );
}
