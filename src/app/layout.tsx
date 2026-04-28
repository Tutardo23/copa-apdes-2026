import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "../components/layout/BottomNav";
import SideNav from "../components/layout/SideNav"; // Importamos el nuevo menú de PC
import { TournamentProvider } from "../components/providers/TournamentProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Copa APDES | Resultados Live",
  description: "Fixture, resultados y posiciones de la Copa APDES.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-[#f8fafc]`}>
        <TournamentProvider>
          <div className="flex h-screen w-full overflow-hidden">
            {/* Menú lateral (Visible solo en PC: md:flex) */}
            <SideNav />

            {/* Área de contenido principal */}
            <main className="relative h-full flex-1 overflow-y-auto scroll-smooth pb-28 md:pb-0">
              {children}
            </main>

            {/* Menú inferior (Visible solo en Celular: md:hidden) */}
            <BottomNav />
          </div>
        </TournamentProvider>
      </body>
    </html>
  );
}
