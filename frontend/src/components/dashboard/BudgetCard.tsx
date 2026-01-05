interface BudgetCardProps {
  budgetStats: any;
  receiptInputRef: React.RefObject<HTMLInputElement | null>;
  handleReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function BudgetCard({
  budgetStats,
  receiptInputRef,
  handleReceiptUpload,
  toggleSection,
  expandedSection,
}: BudgetCardProps) {
  const percentage = Math.min(
    ((budgetStats?.monthly_total || 0) / 1000) * 100,
    100
  );
  const isExpanded = expandedSection === "budget";

  return (
    <div
      className={`relative group overflow-hidden rounded-3xl border transition-all duration-300 select-none ${
        isExpanded
          ? "bg-slate-900/80 border-slate-700/50 shadow-2xl"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      } backdrop-blur-xl`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"></div>

      <button
        onClick={() => toggleSection("budget")}
        className="w-full p-5 flex items-center justify-between cursor-pointer group relative z-10"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl text-emerald-400">
            💸
          </div>
          <div className="text-left">
            <h2 className="font-bold text-white text-base">Budget</h2>
            <p className="text-xs text-emerald-400 font-medium">
              {budgetStats?.monthly_total || 0}€ dépensés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini Jauge en mode compact */}
          {!isExpanded && (
            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          )}
          <span
            className={`transform transition-transform duration-300 ${
              isExpanded
                ? "rotate-180 text-white"
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300 cursor-default relative z-10">
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                {budgetStats?.month_label || "Mensuel"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  receiptInputRef.current?.click();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-colors text-xs font-medium"
              >
                <span>📷</span> Scanner Ticket
              </button>
              <input
                type="file"
                ref={receiptInputRef}
                onChange={handleReceiptUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                {budgetStats?.monthly_total || 0}€
              </span>
              <span className="text-sm text-slate-400 font-medium">
                dépensés
              </span>
            </div>

            {/* Jauge Premium */}
            <div className="relative h-3 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-emerald-400 font-medium">
                {Math.round(percentage)}% utilisé
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Objectif: 1000€
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
