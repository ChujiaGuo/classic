export async function createSession(idToken: string): Promise<void> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("Failed to create session");
}
