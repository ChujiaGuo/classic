"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { AuthMode } from "@/app/login/page";
import { FirebaseError } from "firebase/app";
import Image from "next/image";

interface Props {
    onSwitch: (mode: AuthMode) => void;
}

export default function LoginForm({ onSwitch }: Props) {
    const auth = getAuth();
    const router = useRouter()
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const handleEmailAndPasswordSignIn = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            setPassword("");
            router.push("/dashboard");
        } catch (err) {
            const firebaseError = err as FirebaseError;
            console.error(firebaseError.code, firebaseError.message)
            switch (firebaseError.code) {
                case "auth/invalid-credential":
                    setError("There was an issue with your email or password.");
                    break;
                default:
                    setError("An unexpected error occurred. Please try again.");
            }
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            const idToken = await userCredential.user.getIdToken();
            await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });
            router.push("/dashboard");
        } catch (err) {
            const firebaseError = err as FirebaseError;
            console.error(firebaseError.code, firebaseError.message);
            setError("Google sign-in failed. Please try again.");
        }
    };

    return (
        <>
            <h1 className="text-2xl font-semibold mb-6">Login</h1>
            <form className="flex flex-col w-3/4" onSubmit={handleEmailAndPasswordSignIn}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded border border-gray-400 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 mt-4 rounded border border-gray-400 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                <span className="pl-2 mt-2">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </span>
                <button type="submit" className="bg-blue-500 text-white p-3 mt-4 rounded hover:bg-blue-600 transition-colors shadow-light-glow cursor-pointer">
                    Sign In
                </button>
            </form>

            <button onClick={handleGoogleSignIn} className="flex mt-4 items-center overflow-hidden rounded border shadow-light-glow cursor-pointer">
                <Image src="/web_neutral_sq_SI.svg" alt="Sign in with Google" width={160} height={40} priority />
            </button>

            <p className="mt-4 text-sm w-full text-center">
                Don't have an account?{" "}
                <button className="text-blue-600 hover:underline cursor-pointer" onClick={() => onSwitch("create")}>
                    Create Account
                </button>
            </p>
            <p className="mt-2 text-sm w-full text-center">
                Forgot your password?{" "}
                <button className="text-blue-600 hover:underline cursor-pointer" onClick={() => onSwitch("reset")}>
                    Reset Password
                </button>
            </p>
        </>
    );
}
