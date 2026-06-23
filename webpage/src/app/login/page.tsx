"use client"

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import CreateAccountForm from "@/components/auth/CreateAccountForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Loading from "@/components/generic/Loading";
import { AuthMode } from "@/types/auth";

export default function Login() {
    const router = useRouter();
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });
                if (res.ok) {
                    router.push("/dashboard");
                } else {
                    setLoading(false);
                }
            } catch {
                setLoading(false);
            }
        };

        checkSession();
    }, [router]);

    if (loading) return <Loading />;

    return (
        <div className="flex grow flex-row h-full items-center justify-center">
            <div className="flex flex-col w-3/4 max-w-sm aspect-[3/4] bg-[#D6D6D6] rounded-md items-center justify-center p-6 shadow-medium-glow">
                {authMode === "login" && <LoginForm onSwitch={setAuthMode} />}
                {authMode === "create" && <CreateAccountForm onSwitch={setAuthMode} />}
                {authMode === "reset" && <ResetPasswordForm onSwitch={setAuthMode} />}
            </div>
        </div>
    );
}
