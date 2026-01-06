interface Email {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
}

interface GmailCardProps {
  emails: Email[];
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function GmailCard({
  emails,
  toggleSection,
  expandedSection,
}: GmailCardProps) {
  const hasEmails = emails && emails.length > 0;
  const isExpanded = expandedSection === "gmail";

  return (
    <div
      className={`relative group rounded-3xl transition-all duration-500 ease-out select-none ${
        isExpanded
          ? "bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-3xl"
          : "overflow-hidden bg-linear-to-br from-slate-800/30 to-slate-900/30 border-t border-l border-white/10 border-b border-r border-black/20 shadow-lg hover:shadow-xl hover:bg-slate-800/40 hover:scale-[1.02] backdrop-blur-2xl"
      }`}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-rose-600/20 to-pink-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none rounded-3xl"></div>
      <button
        onClick={() => toggleSection("gmail")}
        className={`w-full p-5 flex items-center justify-between cursor-pointer group relative z-40 transition-all duration-300 ${
          isExpanded
            ? "sticky top-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 rounded-t-3xl shadow-lg"
            : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl transition-colors shadow-lg ${
              hasEmails
                ? "bg-linear-to-br from-rose-500 to-red-600 text-white shadow-rose-900/20 ring-1 ring-white/10"
                : "bg-slate-800/50 text-slate-500 border border-white/5"
            }`}
          >
            📧
          </div>
          <div className="text-left">
            <h2 className="font-medium text-white text-base tracking-wide">
              Emails
            </h2>
            <p
              className={`text-xs font-medium ${
                hasEmails ? "text-red-200/70" : "text-slate-500"
              }`}
            >
              {hasEmails ? `${emails.length} important(s)` : "Aucun message"}
            </p>
          </div>
        </div>
        <span
          className={`transform transition-transform duration-300 ${
            isExpanded
              ? "rotate-180 text-white"
              : "text-slate-600 group-hover:text-slate-400"
          }`}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="p-5 pt-0 animate-in slide-in-from-top-2 duration-300 cursor-default">
          <div className="space-y-3 mt-2">
            {!hasEmails ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-slate-400 italic text-sm">
                  Rien à signaler, votre boîte est calme. 😌
                </p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-white truncate max-w-[70%]">
                      {email.sender}
                    </span>
                    <span className="text-[10px] text-red-300 font-bold bg-red-500/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                      Important
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium truncate mb-1">
                    {email.subject}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {email.snippet}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
