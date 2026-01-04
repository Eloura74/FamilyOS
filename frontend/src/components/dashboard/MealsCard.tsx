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
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-4 select-none">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🍽️ Menu du Jour
          </h2>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Empêcher le drag lors du clic
                toggleSection("meals");
              }}
              onPointerDown={(e) => e.stopPropagation()} // Empêcher le drag start
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              📅 Planning
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                menuInputRef.current?.click();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              📷 Scanner
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
        {expandedSection === "meals" ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 cursor-default">
            {Object.keys(meals).length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center">
                Aucun menu scanné.
              </p>
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
                      className={`p-3 rounded-xl border ${
                        isToday
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-slate-800/50 border-slate-700/50"
                      }`}
                    >
                      <h3
                        className={`text-xs font-bold uppercase mb-2 ${
                          isToday ? "text-blue-300" : "text-slate-400"
                        }`}
                      >
                        {dateLabel} {isToday && "(Aujourd'hui)"}
                      </h3>
                      <div className="space-y-2">
                        {meal.lunch && (
                          <div className="flex items-start gap-2">
                            <span className="text-orange-400 text-[10px] font-bold uppercase mt-0.5 w-8 shrink-0">
                              Midi
                            </span>
                            <p className="text-slate-300 text-sm">
                              {meal.lunch}
                            </p>
                          </div>
                        )}
                        {meal.dinner && (
                          <div className="flex items-start gap-2">
                            <span className="text-indigo-400 text-[10px] font-bold uppercase mt-0.5 w-8 shrink-0">
                              Soir
                            </span>
                            <p className="text-slate-300 text-sm">
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
          (() => {
            const todayKey = new Date().toISOString().split("T")[0];
            const todayMeal = meals[todayKey];

            if (!todayMeal)
              return (
                <p className="text-slate-500 text-sm italic">
                  Rien de prévu aujourd'hui.
                </p>
              );

            return (
              <div className="space-y-2">
                {todayMeal.lunch && (
                  <div className="flex items-start gap-2">
                    <span className="text-orange-400 text-xs font-bold uppercase mt-0.5 w-10 shrink-0">
                      Midi
                    </span>
                    <p className="text-slate-300 text-sm">{todayMeal.lunch}</p>
                  </div>
                )}
                {todayMeal.dinner && (
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 text-xs font-bold uppercase mt-0.5 w-10 shrink-0">
                      Soir
                    </span>
                    <p className="text-slate-300 text-sm">{todayMeal.dinner}</p>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
