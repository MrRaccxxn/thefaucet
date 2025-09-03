"use client";

import { ClaimSection } from "@/components/home/claim-section";
import { NetworkStatusBadge } from "@/components/home/network-status-badge";
import { useNetworkStore, useInitialization } from "@/lib/stores";
import { ClientOnly } from "@/components/providers/client-only";

export default function Home() {
  // Initialize app state
  useInitialization();

  // Get state from stores with specific selector
  const selectedChain = useNetworkStore((state) => state.selectedChain);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin-slow"></div>
        </div>

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <section className="container mx-auto px-6 py-32 md:py-40 lg:py-48">
          <div className="max-w-4xl mx-auto text-center">
            {/* Network Status Badge with Wallet Actions */}
            <ClientOnly fallback={
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm text-sm text-muted-foreground mb-8 border border-border/20">
                <span className="text-sm">Loading...</span>
              </div>
            }>
              <NetworkStatusBadge />
            </ClientOnly>

            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 animate-fade-in-up ">
              The
              <span className="text-6xl md:text-9xl lg:text-10xl block font-medium bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient font-literata -mt-4 md:-mt-6 lg:-mt-8">
                faucet
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delayed">
              Get test tokens instantly across multiple blockchain networks.
            </p>

            {/* Main Interface */}
            <ClaimSection />
          </div>
        </section>
      </div>
    </div>
  );
}
