import type { Metadata, Viewport } from "next";
import { Anton, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Latin only: every font file listed here is preloaded on a first visit, and
// the extended set (Central European letters) cost three extra downloads the
// site's English copy never used. Rare letters fall back to the system font.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

// Body text. General Sans (Indian Type Foundry, via Fontshare, ITF Free Font
// License, see src/fonts/GeneralSans-LICENSE.txt), self-hosted: one variable
// file covers every weight the site uses, 200 to 700.
const generalSans = localFont({
  src: "../fonts/GeneralSans-Variable.woff2",
  weight: "200 700",
  variable: "--font-general-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// The naira sign alone (see src/fonts/Naira-LICENSE.txt). None of the fonts
// above has ₦, and a phone's fallback monospace often lacks it too, so it
// showed as a box. Each face covers U+20A6 only, so every other character
// keeps its own font, and the browser downloads it only on pages showing ₦.
const nairaDisplay = localFont({
  src: "../fonts/Naira-Anton.woff2",
  variable: "--font-naira-display",
  display: "swap",
  preload: false,
  // No generated fallback face: it would cover every character and, sitting
  // ahead of the house font in the stack, take over all the text.
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20A6" }],
});

const nairaMono = localFont({
  src: "../fonts/Naira-SourceCodePro.woff2",
  weight: "200 900",
  variable: "--font-naira-mono",
  display: "swap",
  preload: false,
  // No generated fallback face: it would cover every character and, sitting
  // ahead of the house font in the stack, take over all the text.
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20A6" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Dominion House",
    template: "%s · Dominion House",
  },
  description:
    "A new frontier church raising kingdom leaders, a people of purpose, passion and power. Nine lighthouses across Nigeria, the UK, Canada and Trinidad.",
  openGraph: {
    type: "website",
    siteName: "Dominion House",
    title: "Dominion House",
    description:
      "The church that never sleeps. Nine campuses across four countries. Fresh Fire Camp Meeting 2027 registration is open.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${generalSans.variable} ${jetbrains.variable} ${nairaDisplay.variable} ${nairaMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
