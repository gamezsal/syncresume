import type { Metadata } from "next";
import ChatDrawer from "@/components/chat/ChatDrawer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://syncresume--syncresume-e2d3d.us-central1.hosted.app"),
  title: "syncresume | Multimodal Portfolio & Engineering Hub",
  description: "Real-time automated engineering portfolio synchronized with GitHub and verified by AI.",
  openGraph: {
    title: "syncresume | Multimodal Portfolio & Engineering Hub",
    description: "Real-time automated engineering portfolio synchronized with GitHub and verified by AI.",
    url: "https://syncresume--syncresume-e2d3d.us-central1.hosted.app",
    siteName: "syncresume",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://syncresume--syncresume-e2d3d.us-central1.hosted.app/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "syncresume — Multimodal Engineering Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "syncresume | Multimodal Portfolio & Engineering Hub",
    description: "Real-time automated engineering portfolio synchronized with GitHub and verified by AI.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-slate-100 antialiased selection:bg-teal-500/20 selection:text-teal-300">
        <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-teal-500" />
              <span className="font-mono text-sm tracking-widest text-zinc-400">syncresume.io</span>
            </div>
            <nav className="flex gap-6 text-sm font-medium text-zinc-400">
              <a href="/" className="hover:text-teal-400 transition-colors">Showcase</a>
              <span className="text-zinc-800">|</span>
              <span className="text-zinc-600 cursor-not-allowed">Resume (Manually Staged)</span>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        
        {modal}
        <ChatDrawer />
      </body>
    </html>
  );
}
