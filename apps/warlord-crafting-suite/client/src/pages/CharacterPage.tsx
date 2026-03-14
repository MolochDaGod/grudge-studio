import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Plus, Trash2, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacter } from "@/contexts/CharacterContext";
import { CharacterStatsPanel } from "@/components/character/CharacterStatsPanel";
import { Link } from "wouter";

// Infer Character type from the context to avoid workspace alias resolution issues
type Character = NonNullable<ReturnType<typeof useCharacter>["character"]>;

export default function CharacterPage() {
  const { user, isAuthenticated } = useAuth();
  const { character: activeCharacter, setCharacter } = useCharacter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try fetching by user ID first
      const res = await fetch(`/api/characters?userId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        setCharacters(Array.isArray(data) ? data : []);
      } else {
        // Fallback: if user has an active character, show at least that
        if (activeCharacter) {
          setCharacters([activeCharacter]);
        } else {
          setCharacters([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch characters:", err);
      // Fallback to active character from context
      if (activeCharacter) {
        setCharacters([activeCharacter]);
      } else {
        setCharacters([]);
      }
      setError("Could not connect to server. Showing local data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [user?.id]);

  // Also ensure the active character from context is in the list
  useEffect(() => {
    if (activeCharacter && characters.length > 0) {
      const found = characters.find((c) => c.id === activeCharacter.id);
      if (!found) {
        setCharacters((prev) => [activeCharacter, ...prev]);
      }
    }
  }, [activeCharacter, characters]);

  const handleSelectCharacter = (char: Character) => {
    setCharacter(char);
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!confirm("Are you sure you want to delete this character? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/characters/${charId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setCharacters((prev) => prev.filter((c) => c.id !== charId));
        if (activeCharacter?.id === charId) {
          setCharacter(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete character:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
            <h2 className="text-xl font-heading font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-sm text-slate-400 mb-4">Log in to view and manage your characters.</p>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-uncial gold-text mb-1">Characters</h1>
          <p className="text-slate-400 text-sm">
            Manage your characters — select, view stats, or create a new one.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCharacters}
            disabled={loading}
            data-testid="button-refresh-characters"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/">
            <Button size="sm" data-testid="button-create-new-character">
              <Plus className="w-4 h-4 mr-1" />
              New Character
            </Button>
          </Link>
        </div>
      </header>

      {error && (
        <div className="flex-shrink-0 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Character list */}
        <div className="w-80 flex-shrink-0 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Loading characters...</p>
            </div>
          ) : characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <User className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">No characters yet</p>
              <p className="text-xs text-slate-600 mb-4">Create one from the Dashboard.</p>
              <Link href="/">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Character
                </Button>
              </Link>
            </div>
          ) : (
            characters.map((char) => {
              const isActive = activeCharacter?.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectCharacter(char)}
                  className={cn(
                    "w-full text-left rounded-lg border-2 p-3 transition-all duration-200 group relative",
                    isActive
                      ? "border-amber-500 bg-slate-800/80 shadow-lg"
                      : "border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800/60"
                  )}
                  style={isActive ? { boxShadow: "0 0 16px hsl(43 85% 55% / 0.2)" } : {}}
                  data-testid={`character-card-${char.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-sm font-bold text-amber-400 flex-shrink-0">
                      {char.avatarUrl ? (
                        <img
                          src={char.avatarUrl}
                          alt={char.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        char.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-heading font-bold text-white truncate">
                          {char.name}
                        </span>
                        {isActive && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {char.classId || char.profession || "Adventurer"} • Lv. {char.level}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-amber-400">{char.gold?.toLocaleString() || 0}G</div>
                    </div>
                  </div>

                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCharacter(char.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded bg-red-500/10 border border-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500/20"
                    title="Delete character"
                    data-testid={`delete-character-${char.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              );
            })
          )}
        </div>

        {/* Character detail panel */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeCharacter ? (
            <CharacterStatsPanel />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-heading font-bold text-slate-400">No Character Selected</p>
                <p className="text-sm mt-1">
                  {characters.length > 0
                    ? "Select a character from the list to view their stats."
                    : "Create a character from the Dashboard to get started."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
