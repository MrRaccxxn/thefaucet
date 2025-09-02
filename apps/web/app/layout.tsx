import type { Metadata } from "next";
import localFont from "next/font/local";
import { Literata } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GitHubAuthModal } from "@/components/modals/github-auth-modal";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { WagmiAppProvider } from "@/components/providers/wagmi-provider";
import { ClientOnly } from "@/components/providers/client-only";
import { TRPCProvider } from "@/lib/trpc/provider";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "The faucet - Multichain Testnet Faucet",
    template: "%s | The faucet",
  },
  description:
    "Get test tokens for Ethereum, Polygon, BSC, and more. A multichain testnet faucet for developers.",
  keywords: [
    "testnet",
    "faucet",
    "ethereum",
    "polygon",
    "bsc",
    "tokens",
    "developers",
  ],
  authors: [{ name: "The faucet Team" }],
  creator: "The faucet Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thefaucet.dev",
    title: "The faucet - Multichain Testnet Faucet",
    description:
      "Get test tokens for Ethereum, Polygon, BSC, and more. A multichain testnet faucet for developers.",
    siteName: "The faucet",
  },
  twitter: {
    card: "summary_large_image",
    title: "The faucet - Multichain Testnet Faucet",
    description:
      "Get test tokens for Ethereum, Polygon, BSC, and more. A multichain testnet faucet for developers.",
    creator: "@thefaucet",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light') {
                  document.documentElement.classList.remove('dark')
                } else {
                  document.documentElement.classList.add('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} font-sans antialiased`}
      >
        <AuthSessionProvider>
          <TRPCProvider>
            <ToastProvider>
              <ClientOnly fallback={
                <div className="relative flex min-h-screen flex-col">
                  <div className="h-16" /> {/* Navbar placeholder */}
                  <main className="flex-1 pt-0">{children}</main>
                </div>
              }>
                <WagmiAppProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <ClientOnly fallback={<div className="h-16" />}>
                      <Navbar />
                    </ClientOnly>
                    <main className="flex-1 pt-0">{children}</main>
                    <Footer />
                    <GitHubAuthModal />
                  </div>
                </WagmiAppProvider>
              </ClientOnly>
            </ToastProvider>
          </TRPCProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
