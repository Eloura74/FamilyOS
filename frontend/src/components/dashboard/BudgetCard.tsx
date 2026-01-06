interface BudgetCardProps {
  budgetStats: any;
  budgetLimit: number;
  receiptInputRef: React.RefObject<HTMLInputElement | null>;
  handleReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function BudgetCard({
  budgetStats,
  budgetLimit,
  receiptInputRef,
  handleReceiptUpload,
  toggleSection,
  expandedSection,
}: BudgetCardProps) {
  const percentage = Math.min(
    ((budgetStats?.monthly_total || 0) / budgetLimit) * 100,
    100
  );
  const isExpanded = expandedSection === "budget";

  return (
    <div
      className={`relative group rounded-3xl transition-all duration-500 ease-out select-none ${
        isExpanded
          ? "bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-3xl"
          : "overflow-hidden bg-linear-to-br from-slate-800/30 to-slate-900/30 border-t border-l border-white/10 border-b border-r border-black/20 shadow-lg hover:shadow-xl hover:bg-slate-800/40 hover:scale-[1.02] backdrop-blur-2xl"
      }`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-600/20 to-teal-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none rounded-3xl"></div>

      <button
        onClick={() => toggleSection("budget")}
        className={`w-full p-5 flex items-center justify-between cursor-pointer group relative z-40 transition-all duration-300 ${
          isExpanded
            ? "sticky top-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 rounded-t-3xl shadow-lg"
            : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-2xl text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/10">
            💸
          </div>
          <div className="text-left">
            <h2 className="font-medium text-white text-base tracking-wide">
              Budget
            </h2>
            <p className="text-xs text-emerald-200/70 font-medium">
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
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // @ts-ignore
                    const { Camera, CameraResultType, CameraSource } =
                      await import("@capacitor/camera");
                    const image = await Camera.getPhoto({
                      quality: 90,
                      allowEditing: false,
                      resultType: CameraResultType.Uri,
                      source: CameraSource.Prompt,
                    });

                    if (image.webPath) {
                      const response = await fetch(image.webPath);
                      const blob = await response.blob();
                      const file = new File([blob], "receipt.jpg", {
                        type: "image/jpeg",
                      });
                      const event = {
                        target: { files: [file] },
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleReceiptUpload(event);
                    }
                  } catch (err) {
                    console.error(err);
                    // alert("Erreur: " + JSON.stringify(err));
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-colors text-xs font-medium"
              >
                <span>📷</span> Scanner Ticket
              </button>
              {/* Input caché conservé pour compatibilité web si besoin */}
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
                className="absolute top-0 left-0 h-full bg-linear-to-r from-emerald-600 to-teal-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(5,150,105,0.5)]"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-emerald-400 font-medium">
                {Math.round(percentage)}% utilisé
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Objectif: {budgetLimit}€
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
