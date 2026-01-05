interface MealsCardProps {
  meals: Record<string, any>;
  toggleSection: (section: string) => void;
  expandedSection: string | null;
  menuInputRef: React.RefObject<HTMLInputElement | null>;
  handleMenuUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MealsCard({
  meals,
  toggleSection,
  expandedSection,
  menuInputRef,
  handleMenuUpload,
}: MealsCardProps) {
  const isExpanded = expandedSection === "meals";

  return (
    <div
      className={`relative group overflow-hidden rounded-3xl border transition-all duration-300 select-none ${
        isExpanded
          ? "bg-slate-900/80 border-slate-700/50 shadow-2xl"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      } backdrop-blur-xl`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"></div>

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl text-orange-400">
              🍽️
            </div>
            <h2 className="text-base font-bold text-white">Menu du Jour</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection("meals");
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-colors"
              title="Voir le planning"
            >
              📅
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                menuInputRef.current?.click();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-colors"
              title="Scanner un menu"
            >
              📷
            </button>
          </div>
          <input
            type="file"
            ref={menuInputRef}
            onChange={handleMenuUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Vue Planning Complet (Accordéon) */}
        {isExpanded ? (
          <div className="space-y-3 mt-4 animate-in slide-in-from-top-2 cursor-default">
            {Object.keys(meals).length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-slate-400 italic text-sm">
                  Aucun menu scanné.
                </p>
              </div>
            ) : (
              Object.entries(meals)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([date, meal]: [string, any]) => {
                  const dateObj = new Date(date);
                  const dateLabel = dateObj.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                  const isToday =
                    date === new Date().toISOString().split("T")[0];

                  return (
                    <div
                      key={date}
                      className={`p-4 rounded-2xl border transition-colors ${
                        isToday
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <h3
                        className={`text-xs font-bold uppercase mb-3 tracking-wider ${
                          isToday ? "text-blue-300" : "text-slate-400"
                        }`}
                      >
                        {dateLabel} {isToday && "(Aujourd'hui)"}
                      </h3>
                      <div className="space-y-3">
                        {meal.lunch && (
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                              Midi
                            </span>
                            <p className="text-slate-200 text-sm font-medium leading-relaxed">
                              {meal.lunch}
                            </p>
                          </div>
                        )}
                        {meal.dinner && (
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                              Soir
                            </span>
                            <p className="text-slate-200 text-sm font-medium leading-relaxed">
                              {meal.dinner}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          /* Vue Compacte (Aujourd'hui uniquement) */
          <div className="mt-2">
            {(() => {
              const todayKey = new Date().toISOString().split("T")[0];
              const todayMeal = meals[todayKey];

              if (!todayMeal)
                return (
                  <p className="text-slate-500 text-sm italic pl-1">
                    Rien de prévu aujourd'hui.
                  </p>
                );

              return (
                <div className="space-y-2">
                  {todayMeal.lunch && (
                    <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-orange-400 text-xs font-bold uppercase mt-0.5">
                        Midi
                      </span>
                      <p className="text-slate-200 text-sm font-medium truncate">
                        {todayMeal.lunch}
                      </p>
                    </div>
                  )}
                  {todayMeal.dinner && (
                    <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-indigo-400 text-xs font-bold uppercase mt-0.5">
                        Soir
                      </span>
                      <p className="text-slate-200 text-sm font-medium truncate">
                        {todayMeal.dinner}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
