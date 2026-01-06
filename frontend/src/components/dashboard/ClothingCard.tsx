interface ClothingCardProps {
  weather: any;
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function ClothingCard({
  weather,
  toggleSection,
  expandedSection,
}: ClothingCardProps) {
  const isExpanded = expandedSection === "clothing";

  return (
    <div
      className={`relative group rounded-3xl transition-all duration-500 ease-out select-none ${
        isExpanded
          ? "bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-3xl"
          : "overflow-hidden bg-linear-to-br from-slate-800/30 to-slate-900/30 border-t border-l border-white/10 border-b border-r border-black/20 shadow-lg hover:shadow-xl hover:bg-slate-800/40 hover:scale-[1.02] backdrop-blur-2xl"
      }`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600/20 to-purple-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none rounded-3xl"></div>

      <button
        onClick={() => toggleSection("clothing")}
        className={`w-full p-5 flex items-center justify-between cursor-pointer group relative z-40 transition-all duration-300 ${
          isExpanded
            ? "sticky top-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 rounded-t-3xl shadow-lg"
            : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-violet-600 to-purple-700 flex items-center justify-center text-2xl text-white shadow-lg shadow-purple-900/20 ring-1 ring-white/10">
            👕
          </div>
          <div className="text-left">
            <h2 className="font-medium text-white text-base tracking-wide">
              Tenue conseillée
            </h2>
            {!isExpanded && (
              <p className="text-xs text-purple-200/70 truncate max-w-[200px] font-medium">
                {weather?.recommendation?.summary}
              </p>
            )}
          </div>
        </div>
        <span
          className={`transform transition-transform duration-300 ${
            isExpanded
              ? "rotate-180 text-white"
              : "text-slate-500 group-hover:text-slate-300"
          }`}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="p-5 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300 cursor-default relative z-10">
          <p className="text-lg font-light text-slate-200 leading-relaxed mb-6 mt-4 italic">
            "{weather?.recommendation?.summary}"
          </p>
          <div className="flex flex-wrap gap-2">
            {weather?.recommendation?.items.map((item: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-xl text-xs font-medium shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
