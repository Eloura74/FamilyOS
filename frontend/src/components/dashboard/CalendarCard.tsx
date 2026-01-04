interface CalendarCardProps {
  events: any[];
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function CalendarCard({
  events,
  toggleSection,
  expandedSection,
}: CalendarCardProps) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all duration-300 select-none">
      <button
        onClick={(e) => {
          // e.stopPropagation(); // On laisse propager pour le drag
          toggleSection("calendar");
        }}
        // onPointerDown={(e) => e.stopPropagation()} // On laisse propager pour le drag
        className="w-full p-4 flex items-center justify-between bg-slate-800/30 active:bg-slate-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📅</span>
          <div className="text-left">
            <h2 className="font-bold text-white text-sm">Agenda Familial</h2>
            <p className="text-xs text-emerald-300">
              {events.length} événement(s) à venir
            </p>
          </div>
        </div>
        <span
          className={`transform transition-transform ${
            expandedSection === "calendar" ? "rotate-180" : ""
          } text-slate-500`}
        >
          ▼
        </span>
      </button>

      {expandedSection === "calendar" && (
        <div className="p-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 cursor-default">
          <div className="space-y-3 mt-4">
            {events.length === 0 ? (
              <p className="text-slate-400 italic text-sm text-center py-2">
                Rien de prévu pour le moment.
              </p>
            ) : (
              <div className="space-y-8">
                {Object.entries(
                  events.reduce((groups, event) => {
                    const date = event.start.split("T")[0];
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(event);
                    return groups;
                  }, {} as Record<string, any[]>)
                ).map(([date, dayEvents]: [string, any[]]) => {
                  const dateObj = new Date(date);
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);

                  let dateLabel = dateObj.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });

                  if (dateObj.toDateString() === today.toDateString()) {
                    dateLabel = "Aujourd'hui";
                  } else if (
                    dateObj.toDateString() === tomorrow.toDateString()
                  ) {
                    dateLabel = "Demain";
                  }

                  // Capitalize first letter
                  dateLabel =
                    dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

                  return (
                    <div key={date}>
                      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 pl-2 border-b border-slate-800 pb-2">
                        {dateLabel}
                      </h3>
                      <div className="relative border-l-2 border-slate-800 ml-3 space-y-6 py-2 my-2">
                        {dayEvents.map((event: any, idx: number) => {
                          const eventDate = new Date(event.start);
                          const isPast = event.end
                            ? new Date(event.end) < new Date()
                            : eventDate < new Date();

                          return (
                            <div key={idx} className="relative pl-6">
                              {/* Point sur la ligne */}
                              <div
                                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                                  isPast
                                    ? "bg-slate-900 border-slate-700"
                                    : "bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                }`}
                              ></div>

                              {/* Heure */}
                              <div
                                className={`text-xs font-bold mb-1 ${
                                  isPast ? "text-slate-600" : "text-blue-400"
                                }`}
                              >
                                {event.all_day
                                  ? "JOURNÉE"
                                  : eventDate.toLocaleTimeString("fr-FR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                              </div>

                              {/* Carte Événement */}
                              <div
                                className={`p-3 rounded-xl border transition-all ${
                                  isPast
                                    ? "bg-slate-900/50 border-slate-800 opacity-60 grayscale-[0.5]"
                                    : "bg-slate-800 border-slate-700 shadow-lg"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3
                                      className={`font-bold text-sm ${
                                        isPast ? "text-slate-400" : "text-white"
                                      }`}
                                    >
                                      {event.title}
                                    </h3>
                                    {event.location && (
                                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                        📍 {event.location}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Tags */}
                                {event.tags && event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {event.tags.map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] rounded uppercase font-bold tracking-wider border border-blue-500/20"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Sac d'activité */}
                                {event.required_items &&
                                  event.required_items.length > 0 && (
                                    <div
                                      className={`mt-3 rounded-lg p-2 border ${
                                        isPast
                                          ? "bg-slate-800/50 border-slate-700/50"
                                          : "bg-blue-500/10 border-blue-500/20"
                                      }`}
                                    >
                                      <div
                                        className={`flex items-center gap-2 mb-2 ${
                                          isPast
                                            ? "text-slate-500"
                                            : "text-blue-300"
                                        }`}
                                      >
                                        <span className="text-base">🎒</span>
                                        <span className="text-[10px] font-bold uppercase">
                                          Sac à préparer
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {event.required_items.map(
                                          (item: string, i: number) => (
                                            <span
                                              key={i}
                                              className="px-2 py-1 bg-slate-900/80 text-slate-300 text-[10px] rounded border border-slate-700/50"
                                            >
                                              {item}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
