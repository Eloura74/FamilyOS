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
      className={`relative group overflow-hidden rounded-3xl border transition-all duration-300 select-none ${
        isExpanded
          ? "bg-slate-900/80 border-slate-700/50 shadow-2xl"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      } backdrop-blur-xl`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"></div>

      <button
        onClick={() => toggleSection("clothing")}
        className="w-full p-5 flex items-center justify-between cursor-pointer group relative z-10"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-2xl text-purple-400">
            👕
          </div>
          <div className="text-left">
            <h2 className="font-bold text-white text-base">Tenue conseillée</h2>
            {!isExpanded && (
              <p className="text-xs text-purple-300 truncate max-w-[200px] font-medium">
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
