import type { Metadata } from "next";
import { nunito } from "@/fonts/fonts";
import "./globals.css"

export const metadata: Metadata = {
  title: "Classic",
  description: "A tool for students to efficiently manage their semester's schedules. No more digging through Blackboard and Canvas for due dates and schedules that may or may not exist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`flex flex-col min-h-screen ${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
