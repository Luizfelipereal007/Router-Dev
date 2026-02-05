import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Router Dev - Dashboard de Projetos",
  description: "Dashboard local para gerenciar projetos de desenvolvimento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <Sidebar />
            <Topbar />
            <main className="flex-1 ml-64 min-h-screen pt-16">
              <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
