import type { Metadata } from "next";
import { Inter, Playfair_Display, Great_Vibes, JetBrains_Mono, Montserrat, Cinzel, Caveat, Oswald, Dancing_Script } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Loader from "@/components/Loader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-great-vibes", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", display: "swap" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script", display: "swap" });
export const metadata: Metadata = {
  title: "JollyWitMe - Create Amazing Events",
  description: "Create and share beautiful digital invitations with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${greatVibes.variable} ${jetbrainsMono.variable} ${montserrat.variable} ${cinzel.variable} ${caveat.variable} ${oswald.variable} ${dancingScript.variable} font-sans`} suppressHydrationWarning>
        <Providers>
          <Loader />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
