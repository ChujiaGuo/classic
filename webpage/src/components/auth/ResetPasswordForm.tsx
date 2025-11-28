"use client";

import { useState, FormEvent } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { AuthMode } from "@/app/login/page";

interface Props {
    onSwitch: (mode: AuthMode) => void;
}

export default function ResetPasswordForm({ onSwitch }: Props) {
    const auth = getAuth();
    const [email, setEmail] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [sent, setSent] = useState<boolean>(false);

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err) {
            const firebaseError = err as FirebaseError;

            switch (firebaseError.code) {
                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;
                case "auth/user-not-found":
                    setSent(true);
                    break;
                default:
                    setError("Something went wrong. Please try again.");
            }
        }
    };

    if (sent) {
        return (
            <div className="text-center w-full">
                <h1 className="text-2xl font-semibold mb-4">Check Your Email</h1>
                <p className="text-gray-700 mb-6">
                    If an account exists for
                    <br />
                    <span className="font-medium">{email}</span>,
                    <br />
                    a password reset link has been sent.
                    <br />
                    Please remember to check your spam folder.
                </p>

                <button onClick={() => onSwitch("login")} className="bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 transition-colors cursor-pointer w-3/4">
                    Return to Login
                </button>
                <button onClick={() => setSent(false)} className="mt-4 text-blue-600 hover:underline cursor-pointer block w-full">
                    Enter a different email
                </button>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-2xl font-semibold mb-6">Reset Password</h1>

            <form className="flex flex-col w-3/4" onSubmit={handleReset}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded border border-gray-400 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400" required />

                {error && (
                    <p className="text-red-600 text-sm pl-2 mt-2">
                        {error}
                    </p>
                )}

                <button type="submit" className="bg-blue-500 text-white p-3 mt-4 rounded hover:bg-blue-600 transition-colors cursor-pointer">
                    Reset Password
                </button>
            </form>

            <p className="mt-4 text-sm w-full text-center">
                Don't have an account?{" "}
                <button className="text-blue-600 hover:underline cursor-pointer" onClick={() => onSwitch("create")}>
                    Create Account
                </button>
            </p>

            <p className="mt-2 text-sm w-full text-center">
                Remember your password?{" "}
                <button className="text-blue-600 hover:underline cursor-pointer" onClick={() => onSwitch("login")}>
                    Login
                </button>
            </p>
        </>
    );
}
