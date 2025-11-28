"use client"

import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import CreateAccountForm from "@/components/auth/CreateAccountForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Loading from "@/components/generic/Loading";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export type AuthMode = "login" | "create" | "reset";
export default function Login() {
    const auth = getAuth();
    const router = useRouter();
    const [authMode, setAuthMode] = useState<AuthMode>("login");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/dashboard");
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

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