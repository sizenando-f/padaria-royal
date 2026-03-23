import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "./components/MobileNav";
import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "./providers";

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
  title: "Padaria Royal - MRP",
  description: "Sistema de Controle de Produção e Qualidade",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Royal MRP"
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Providers>
          <AuthProvider>
            <main className="pb-24 md:pb-8">{children}</main>
            {/* Menu só aparece quando logado */}
            <MobileNav />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
