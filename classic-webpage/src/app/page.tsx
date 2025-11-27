import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row border ">
          <Link href="/login">
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
