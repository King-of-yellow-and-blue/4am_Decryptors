import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TraceGrid — SOC Dashboard",
  description:
    "Real-time Security Operations Center dashboard with MITRE ATT&CK mapping, live log feed, and AI-powered threat investigation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased bg-[#0a0a0f] min-h-screen">
        {children}
      </body>
    </html>
  );
}
