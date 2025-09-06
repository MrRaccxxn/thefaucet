"use client";

interface RedeemCodeSectionProps {
  redeemCode: string;
  showRedeemCode: boolean;
  onRedeemCodeChange: (code: string) => void;
  onToggleRedeemCode: () => void;
}

export function RedeemCodeSection({
  redeemCode,
  showRedeemCode,
  onRedeemCodeChange,
  onToggleRedeemCode,
}: RedeemCodeSectionProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={onToggleRedeemCode}
        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center mx-auto"
      >
        <span className="mr-1">✨</span>
        Have a redeem code?
        <span className="ml-1">{showRedeemCode ? "−" : "+"}</span>
      </button>

      {showRedeemCode && (
        <div className="p-4 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300 animate-fade-in">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Redeem Code (Optional)
          </label>
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => onRedeemCodeChange(e.target.value)}
            placeholder="Enter code for boosted rewards"
            className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      )}
    </div>
  );
}