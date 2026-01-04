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
  if (!emails || emails.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all duration-300 select-none">
      <button
        onClick={() => toggleSection("gmail")}
        className="w-full p-4 flex items-center justify-between bg-slate-800/30 active:bg-slate-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📧</span>
          <div className="text-left">
            <h2 className="font-bold text-white text-sm">Emails Importants</h2>
            <p className="text-xs text-red-400">
              {emails.length} message(s) à lire
            </p>
          </div>
        </div>
        <span
          className={`transform transition-transform ${
            expandedSection === "gmail" ? "rotate-180" : ""
          } text-slate-500`}
        >
          ▼
        </span>
      </button>

      {expandedSection === "gmail" && (
        <div className="p-4 pt-0 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 cursor-default">
          <div className="space-y-3 mt-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-white truncate max-w-[70%]">
                    {email.sender}
                  </span>
                  <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
                    Important
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium truncate mb-1">
                  {email.subject}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {email.snippet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
