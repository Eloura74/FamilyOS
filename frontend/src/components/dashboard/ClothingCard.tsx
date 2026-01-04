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
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all duration-300 select-none">
      <button
        onClick={(e) => {
          // e.stopPropagation();
          toggleSection("clothing");
        }}
        // onPointerDown={(e) => e.stopPropagation()}
        className="w-full p-4 flex items-center justify-between bg-slate-800/30 active:bg-slate-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">👕</span>
          <div className="text-left">
            <h2 className="font-bold text-white text-sm">Tenue conseillée</h2>
            {!expandedSection && (
              <p className="text-xs text-purple-300 truncate max-w-[200px]">
                {weather?.recommendation?.summary}
              </p>
            )}
          </div>
        </div>
        <span
          className={`transform transition-transform ${
            expandedSection === "clothing" ? "rotate-180" : ""
          } text-slate-500`}
        >
          ▼
        </span>
      </button>

      {expandedSection === "clothing" && (
        <div className="p-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 cursor-default">
          <p className="text-lg font-light text-slate-200 leading-relaxed mb-4 mt-4">
            "{weather?.recommendation?.summary}"
          </p>
          <div className="flex flex-wrap gap-2">
            {weather?.recommendation?.items.map((item: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium"
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
