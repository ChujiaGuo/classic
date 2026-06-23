"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { createSession } from "@/lib/api";
import { signInWithGoogle } from "@/lib/auth";
import { AuthMode } from "@/types/auth";

interface Props {
    onSwitch: (mode: AuthMode) => void;
}

export default function CreateAccountForm({ onSwitch }: Props) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string>("");

    const handleCreateAccount = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await createSession(idToken);
            setPassword("");
            router.push("/dashboard");
        } catch (err) {
            const firebaseError = err as FirebaseError;
            console.error(firebaseError.code, firebaseError.message);
            switch (firebaseError.code) {
                case "auth/email-already-in-use":
                    setError("An account already exists with this email.");
                    break;
                default:
                    setError("An unexpected error occurred. Please try again.");
            }
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await signInWithGoogle();
            router.push("/dashboard");
        } catch (err) {
            const firebaseError = err as FirebaseError;
            console.error(firebaseError.code, firebaseError.message);
            setError("Google sign-up failed. Please try again.");
        }
    };

    return (
        <>
            <h1 className="text-2xl font-semibold mb-6">Create Account</h1>
            <form className="flex flex-col w-3/4" onSubmit={handleCreateAccount}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded border border-gray-400 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 mt-4 rounded border border-gray-400 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                <span className="pl-2 mt-2">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </span>
                <button type="submit" className="bg-blue-500 text-white p-3 mt-4 rounded hover:bg-blue-600 transition-colors cursor-pointer">
                    Create Account
                </button>
            </form>

            <button onClick={handleGoogleSignUp} className="flex mt-4 items-center overflow-hidden rounded border shadow-light-glow cursor-pointer">
                <Image src="/web_neutral_sq_SU.svg" alt="Sign up with Google" width={160} height={40} priority />
            </button>

            <p className="mt-4 text-sm w-full text-center">
                Already have an account?{" "}
                <button className="text-blue-600 hover:underline cursor-pointer" onClick={() => onSwitch("login")}>
                    Login
                </button>
            </p>
        </>
    );
}
