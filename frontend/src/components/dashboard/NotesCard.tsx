import { useState, useEffect } from "react";

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
}

interface NotesCardProps {
  toggleSection: (section: string) => void;
  expandedSection: string | null;
}

export default function NotesCard({
  toggleSection,
  expandedSection,
}: NotesCardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const isExpanded = expandedSection === "notes";

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Erreur chargement notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: newNote, author: "Famille" }),
      });

      if (res.ok) {
        setNewNote("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Erreur ajout note:", error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}`, {
        method: "DELETE",
        headers,
      });
      setNotes(notes.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Erreur suppression note:", error);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notes/${id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ content: editContent }),
        }
      );

      if (res.ok) {
        setNotes(
          notes.map((n) => (n.id === id ? { ...n, content: editContent } : n))
        );
        setEditingNoteId(null);
      }
    } catch (error) {
      console.error("Erreur modification note:", error);
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 select-none overflow-hidden ${
        isExpanded
          ? "bg-yellow-900/20 border-yellow-500/30 shadow-2xl"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      } backdrop-blur-xl group`}
    >
      <button
        onClick={() => toggleSection("notes")}
        className="w-full p-5 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${
              notes.length > 0
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-slate-700/30 text-slate-500"
            }`}
          >
            📝
          </div>
          <div className="text-left">
            <h2 className="font-bold text-white text-base">Frigo Numérique</h2>
            <p
              className={`text-xs font-medium ${
                notes.length > 0 ? "text-yellow-400" : "text-slate-500"
              }`}
            >
              {notes.length > 0
                ? `${notes.length} message${notes.length > 1 ? "s" : ""}`
                : "Aucun message"}
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
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[200px] pr-2 custom-scrollbar mt-2">
            {loading ? (
              <div className="text-center text-white/40 py-4">
                Chargement...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center text-white/40 py-4 italic">
                Aucun message sur le frigo...
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-yellow-100/10 border border-yellow-500/20 rounded-xl p-3 relative group/note hover:bg-yellow-100/20 transition-colors"
                >
                  {editingNoteId === note.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-black/20 border border-yellow-500/50 rounded-lg p-2 text-sm text-white focus:outline-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => saveEdit(note.id)}
                          className="text-xs bg-yellow-500 text-black px-2 py-1 rounded hover:bg-yellow-400"
                        >
                          Sauvegarder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white/90 font-medium">
                        {note.content}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-white/50">
                          {note.author} • {note.date.split(" ")[1]}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(note)}
                            className="text-white/40 hover:text-yellow-400 transition-colors p-1"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-white/40 hover:text-red-400 transition-colors p-1"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddNote} className="relative">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter un post-it..."
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➕
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
