interface BudgetCardProps {
  budgetStats: any;
  receiptInputRef: React.RefObject<HTMLInputElement | null>;
  handleReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BudgetCard({
  budgetStats,
  receiptInputRef,
  handleReceiptUpload,
}: BudgetCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 select-none">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 opacity-20 blur"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            💸 Budget {budgetStats?.month_label}
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              receiptInputRef.current?.click();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            🧾 Scanner Ticket
          </button>
          <input
            type="file"
            ref={receiptInputRef}
            onChange={handleReceiptUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-white">
            {budgetStats?.monthly_total || 0}€
          </span>
          <span className="text-sm text-slate-400 mb-1">dépensés</span>
        </div>

        {/* Jauge simple */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
            style={{
              width: `${Math.min(
                ((budgetStats?.monthly_total || 0) / 1000) * 100,
                100
              )}%`,
            }}
          ></div>
        </div>
        <p className="text-xs text-slate-500 mt-1 text-right">
          Objectif: 1000€
        </p>
      </div>
    </div>
  );
}
