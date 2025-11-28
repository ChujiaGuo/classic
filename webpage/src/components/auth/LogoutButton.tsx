"use client";

import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
            const auth = getAuth();
            await signOut(auth);
            router.push("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };
    return (
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Logout
        </button>
    );
}
