"use client";

import { ClientOnly } from "@/components/providers/client-only";
import { WalletAddressAutofill } from "../home/wallet-address-autofill";

interface WalletAddressInputProps {
  walletAddress: string;
  hasUserEditedAddress: boolean;
  onWalletAddressChange: (address: string) => void;
  onUserEdit: (edited: boolean) => void;
}

export function WalletAddressInput({
  walletAddress,
  hasUserEditedAddress,
  onWalletAddressChange,
  onUserEdit,
}: WalletAddressInputProps) {
  return (
    <div className="p-7 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-foreground">
          Wallet Address
        </label>
        <ClientOnly>
          <WalletAddressAutofill
            walletAddress={walletAddress}
            hasUserEditedAddress={hasUserEditedAddress}
            setWalletAddress={(address) => {
              onWalletAddressChange(address);
              onUserEdit(false);
            }}
          />
        </ClientOnly>
      </div>
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => {
          onWalletAddressChange(e.target.value);
          onUserEdit(true);
        }}
        placeholder="0x..."
        className="w-full px-6 py-5 bg-background/60 border border-border/30 rounded-xl text-lg text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-background/80 focus:text-foreground transition-all duration-200"
      />
    </div>
  );
}