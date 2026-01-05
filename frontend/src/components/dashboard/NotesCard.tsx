import { useState, useEffect } from "react";

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
}

export default function NotesCard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const res = await fetch("http://localhost:8000/api/notes/", { headers });
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

      const res = await fetch("http://localhost:8000/api/notes/", {
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
      await fetch(`http://localhost:8000/api/notes/${id}`, {
        method: "DELETE",
        headers,
      });
      setNotes(notes.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Erreur suppression note:", error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <span className="text-xl">📝</span>
            </div>
            <h2 className="text-lg font-bold text-white">Frigo Numérique</h2>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-white/5 text-white/60 border border-white/10">
            {notes.length} message{notes.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[200px] pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center text-white/40 py-4">Chargement...</div>
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
                <p className="text-sm text-white/90 font-medium">
                  {note.content}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-white/50">
                    {note.author} • {note.date.split(" ")[1]}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-white/40 hover:text-red-400 opacity-0 group-hover/note:opacity-100 transition-opacity"
                  >
                    🗑️
                  </button>
                </div>
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
    </div>
  );
}
