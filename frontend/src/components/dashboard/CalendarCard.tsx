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
  const isExpanded = expandedSection === "calendar";

  return (
    <div
      className={`relative group overflow-hidden rounded-3xl border transition-all duration-300 select-none ${
        isExpanded
          ? "bg-slate-900/80 border-slate-700/50 shadow-2xl"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      } backdrop-blur-xl`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"></div>

      <button
        onClick={() => toggleSection("calendar")}
        className="w-full p-5 flex items-center justify-between cursor-pointer group relative z-10"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl text-blue-400">
            📅
          </div>
          <div className="text-left">
            <h2 className="font-bold text-white text-base">Agenda Familial</h2>
            <p className="text-xs text-blue-300 font-medium">
              {events.length} événement(s) à venir
            </p>
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
          <div className="space-y-6 mt-4">
            {events.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-slate-400 italic text-sm">
                  Rien de prévu pour le moment.
                </p>
              </div>
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

                  dateLabel =
                    dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

                  return (
                    <div key={date}>
                      <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 pl-2 border-b border-white/10 pb-2">
                        {dateLabel}
                      </h3>
                      <div className="relative border-l-2 border-white/10 ml-3 space-y-6 py-2 my-2">
                        {dayEvents.map((event: any, idx: number) => {
                          const eventDate = new Date(event.start);
                          const isPast = event.end
                            ? new Date(event.end) < new Date()
                            : eventDate < new Date();

                          return (
                            <div
                              key={idx}
                              className="relative pl-6 group/event"
                            >
                              {/* Point sur la ligne */}
                              <div
                                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                                  isPast
                                    ? "bg-slate-800 border-slate-600"
                                    : "bg-blue-500 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover/event:scale-110"
                                }`}
                              ></div>

                              {/* Heure */}
                              <div
                                className={`text-xs font-bold mb-1 ${
                                  isPast ? "text-slate-500" : "text-blue-400"
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
                                className={`p-4 rounded-2xl border transition-all ${
                                  isPast
                                    ? "bg-white/5 border-white/5 opacity-60 grayscale-[0.5]"
                                    : "bg-white/10 border-white/10 hover:bg-white/15 hover:border-white/20 shadow-lg"
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
                                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        📍 {event.location}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Tags */}
                                {event.tags && event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3">
                                    {event.tags.map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] rounded-lg uppercase font-bold tracking-wider border border-blue-500/20"
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
                                      className={`mt-3 rounded-xl p-3 border ${
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
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                          Sac à préparer
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {event.required_items.map(
                                          (item: string, i: number) => (
                                            <span
                                              key={i}
                                              className="px-2 py-1 bg-slate-900/80 text-slate-300 text-[10px] rounded-lg border border-slate-700/50 font-medium"
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
