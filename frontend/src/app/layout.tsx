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

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Sou Concursado | Plataforma de Estudos Inteligente",
  description: "A melhor plataforma para estudar para concursos no Brasil com IA e repetição espaçada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background selection:bg-primary/20">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
