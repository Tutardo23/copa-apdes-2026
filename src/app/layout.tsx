import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "../components/layout/BottomNav";
import SideNav from "../components/layout/SideNav"; // Importamos el nuevo menú de PC

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
        <div className="flex h-screen w-full overflow-hidden">
          
          {/* Menú lateral (Visible solo en PC: md:flex) */}
          <SideNav />

          {/* Área de contenido principal */}
          <main className="flex-1 h-full overflow-y-auto relative pb-28 md:pb-0 scroll-smooth"> 
            {children}
          </main>

          {/* Menú inferior (Visible solo en Celular: md:hidden) */}
          <BottomNav />
          
        </div>
      </body>
    </html>
  );
}