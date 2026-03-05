import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "./components/MobileNav";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Padaria Royal",
  description: "Sistema MRP de Gerenciamento de Produção e Predição de Insumos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <main className="pb-24 md:pb-8">{children}</main>
          {/* Menu só aparece quando logado */}
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
