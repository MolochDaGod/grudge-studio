import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio, Users, Swords, Trophy, Activity, RefreshCw, ExternalLink,
  Wifi, WifiOff, Shield, Skull, Crown, Gamepad2, Globe,
} from 'lucide-react';

// â”€â”€ Grudge Backend URLs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GW_API = 'https://grudgewarlords.com/api';
const GAME_API = import.meta.env.VITE_GAME_API_URL || 'https://api.grudge-studio.com';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface PlatformStats {
  totalPlayers: number;
  totalHeroes: number;
  arenaTeams: number;
  arenaBattles: number;
  serverTime: number;
}

interface ArenaStats {
  totalTeams: number;
  rankedTeams: number;
  unrankedTeams: number;
  totalBattles: number;
  recentBattles: RecentBattle[];
}

interface RecentBattle {
  battleId: string;
  teamId: string;
  challengerName: string;
  result: string;
  timestamp: number;
}

interface LobbyTeam {
  teamId: string;
  ownerName: string;
  status: string;
  heroCount: number;
  avgLevel: number;
  wins: number;
  losses: number;
  totalBattles: number;
  createdAt: number;
  heroSummary: { name: string; raceId: string; classId: string; level: number }[];
}

interface LeaderboardEntry {
  rank: number;
  ownerName: string;
  wins: number;
  losses: number;
  heroCount: number;
}

type ServiceStatus = 'online' | 'offline' | 'checking';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch { return fallback; }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function winRate(w: number, l: number): string {
  const total = w + l;
  return total > 0 ? `${Math.round((w / total) * 100)}%` : 'â€”';
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CollaborationHub() {
  const [tab, setTab] = useState<'lobby' | 'leaderboard' | 'battles'>('lobby');
  const [gwStatus, setGwStatus] = useState<ServiceStatus>('checking');
  const [gameApiStatus, setGameApiStatus] = useState<ServiceStatus>('checking');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [arenaStats, setArenaStats] = useState<ArenaStats | null>(null);
  const [lobby, setLobby] = useState<LobbyTeam[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refresh = useCallback(async () => {
    setLoading(true);

    // Health checks
    const gwHealth = fetchJson<{ status: string }>(`${GW_API}/health`, { status: '' });
    const gameHealth = fetchJson<{ status: string }>(`${GAME_API}/health`, { status: '' });

    // Data fetches
    const statsP = fetchJson<PlatformStats>(`${GW_API}/public/stats`, {
      totalPlayers: 0, totalHeroes: 0, arenaTeams: 0, arenaBattles: 0, serverTime: 0,
    });
    const arenaP = fetchJson<ArenaStats>(`${GW_API}/arena/stats`, {
      totalTeams: 0, rankedTeams: 0, unrankedTeams: 0, totalBattles: 0, recentBattles: [],
    });
    const lobbyP = fetchJson<{ teams: LobbyTeam[] }>(`${GW_API}/arena/lobby?limit=20`, { teams: [] });
    const lbP = fetchJson<{ leaderboard: LeaderboardEntry[] }>(`${GW_API}/public/leaderboard`, { leaderboard: [] });

    const [gw, ga, s, a, l, lb] = await Promise.all([gwHealth, gameHealth, statsP, arenaP, lobbyP, lbP]);

    setGwStatus(gw.status === 'ok' ? 'online' : 'offline');
    setGameApiStatus(ga.status ? 'online' : 'offline');
    setStats(s);
    setArenaStats(a);
    setLobby(l.teams || []);
    setLeaderboard(lb.leaderboard || []);
    setLastRefresh(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const StatusDot = ({ status }: { status: ServiceStatus }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${
      status === 'online' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,.6)]'
      : status === 'offline' ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,.6)]'
      : 'bg-yellow-400 animate-pulse'
    }`} />
  );

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold gold-text flex items-center gap-2">
            <Radio className="w-6 h-6" /> Collaboration Hub
          </h1>
          <p className="text-sm text-[hsl(45_20%_55%)] font-body mt-1">
            Live communications &amp; active game lobby
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[hsl(45_15%_45%)]">
            Updated {timeAgo(lastRefresh)}
          </span>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <a href="https://grudgewarlords.com" target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <Gamepad2 className="w-4 h-4 mr-1" /> Play Game <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </a>
        </div>
      </div>

      {/* Service Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <StatusDot status={gwStatus} />
            <div>
              <div className="text-xs text-[hsl(45_15%_45%)] uppercase tracking-wider font-heading">GrudgeWarlords</div>
              <div className="text-sm font-bold flex items-center gap-1">
                {gwStatus === 'online' ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                {gwStatus === 'checking' ? 'Checking...' : gwStatus}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <StatusDot status={gameApiStatus} />
            <div>
              <div className="text-xs text-[hsl(45_15%_45%)] uppercase tracking-wider font-heading">Game API</div>
              <div className="text-sm font-bold flex items-center gap-1">
                {gameApiStatus === 'online' ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                {gameApiStatus === 'checking' ? 'Checking...' : gameApiStatus}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-[hsl(45_15%_45%)] uppercase tracking-wider font-heading">Players</div>
              <div className="text-sm font-bold text-[hsl(43_85%_65%)]">{stats?.totalPlayers ?? 'â€”'}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Swords className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-[hsl(45_15%_45%)] uppercase tracking-wider font-heading">Arena Battles</div>
              <div className="text-sm font-bold text-[hsl(43_85%_65%)]">{stats?.arenaBattles ?? 'â€”'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Heroes', value: stats?.totalHeroes, icon: <Shield className="w-4 h-4 text-cyan-400" /> },
          { label: 'Arena Teams', value: arenaStats?.totalTeams, icon: <Users className="w-4 h-4 text-amber-400" /> },
          { label: 'Ranked', value: arenaStats?.rankedTeams, icon: <Crown className="w-4 h-4 text-yellow-400" /> },
          { label: 'Unranked', value: arenaStats?.unrankedTeams, icon: <Skull className="w-4 h-4 text-slate-400" /> },
          { label: 'Total Battles', value: arenaStats?.totalBattles, icon: <Activity className="w-4 h-4 text-red-400" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">{s.icon}</div>
              <div className="text-lg font-bold text-[hsl(43_85%_65%)] font-heading">{s.value ?? 'â€”'}</div>
              <div className="text-[10px] text-[hsl(45_15%_45%)] uppercase tracking-wider">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-[hsl(43_30%_25%)]">
        {(['lobby', 'leaderboard', 'battles'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-heading font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-colors ${
              tab === t
                ? 'text-[hsl(43_85%_65%)] border-[hsl(43_85%_55%)]'
                : 'text-[hsl(45_15%_45%)] border-transparent hover:text-[hsl(45_30%_70%)]'
            }`}
          >
            {t === 'lobby' && <Globe className="w-4 h-4 inline mr-1 -mt-0.5" />}
            {t === 'leaderboard' && <Trophy className="w-4 h-4 inline mr-1 -mt-0.5" />}
            {t === 'battles' && <Swords className="w-4 h-4 inline mr-1 -mt-0.5" />}
            {t === 'lobby' ? 'Active Lobby' : t === 'leaderboard' ? 'Leaderboard' : 'Recent Battles'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'lobby' && (
        <div className="space-y-2">
          {lobby.length === 0 && !loading && (
            <Card><CardContent className="p-8 text-center text-[hsl(45_15%_45%)]">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-heading text-lg text-[hsl(43_85%_65%)]">No teams in lobby</p>
              <p className="text-sm mt-1">Be the first to enter the arena!</p>
              <a href="https://grudgewarlords.com" target="_blank" rel="noopener noreferrer">
                <Button className="mt-4" size="sm"><Gamepad2 className="w-4 h-4 mr-1" /> Play Now</Button>
              </a>
            </CardContent></Card>
          )}
          {lobby.map(team => (
            <Card key={team.teamId} className={`transition-colors ${team.status === 'ranked' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-600 opacity-80'}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[48px]">
                      <div className="text-lg font-heading font-bold text-[hsl(43_85%_65%)]">{team.wins}W</div>
                      <div className="text-xs text-red-400">{team.losses}L</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-white">{team.ownerName}</span>
                        <Badge variant={team.status === 'ranked' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {team.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {team.heroSummary?.map((h, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(225_25%_18%)] border border-[hsl(43_30%_25%)] text-[hsl(45_20%_60%)]">
                            {h.name} <span className="text-[hsl(43_60%_50%)]">Lv.{h.level}</span> {h.raceId} {h.classId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[hsl(45_15%_45%)]">
                    <div>Win rate: <span className="text-[hsl(43_85%_65%)] font-bold">{winRate(team.wins, team.losses)}</span></div>
                    <div>Avg Lv. {team.avgLevel} â€¢ {team.heroCount} heroes</div>
                    <div>{timeAgo(team.createdAt)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[hsl(43_50%_30%)]">
                    <th className="text-left p-3 text-[10px] uppercase tracking-wider text-[hsl(45_15%_45%)] font-heading">#</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-wider text-[hsl(45_15%_45%)] font-heading">Warlord</th>
                    <th className="text-center p-3 text-[10px] uppercase tracking-wider text-[hsl(45_15%_45%)] font-heading">W</th>
                    <th className="text-center p-3 text-[10px] uppercase tracking-wider text-[hsl(45_15%_45%)] font-heading">L</th>
                    <th className="text-center p-3 text-[10px] uppercase tracking-wider text-[hsl(45_15%_45%)] font-heading">Win%</th>
                    <th className="text-center p-3 text-[10px] uppercase tracking-wider text-[hsl(45_15%_45%)] font-heading">Heroes</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-[hsl(45_15%_45%)]">No leaderboard data yet</td></tr>
                  )}
                  {leaderboard.map((e, i) => (
                    <tr key={i} className="border-b border-[hsl(225_25%_18%)] hover:bg-[hsl(225_25%_15%)] transition-colors">
                      <td className="p-3 font-heading font-bold text-lg">
                        <span className={i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-[hsl(45_15%_45%)]'}>
                          {e.rank}
                        </span>
                      </td>
                      <td className="p-3 font-heading font-bold text-white">{e.ownerName}</td>
                      <td className="p-3 text-center text-green-400 font-bold">{e.wins}</td>
                      <td className="p-3 text-center text-red-400">{e.losses}</td>
                      <td className="p-3 text-center text-[hsl(43_85%_65%)] font-bold">{winRate(e.wins, e.losses)}</td>
                      <td className="p-3 text-center text-[hsl(45_20%_60%)]">{e.heroCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'battles' && (
        <div className="space-y-2">
          {(!arenaStats?.recentBattles || arenaStats.recentBattles.length === 0) && !loading && (
            <Card><CardContent className="p-8 text-center text-[hsl(45_15%_45%)]">
              <Swords className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-heading text-lg text-[hsl(43_85%_65%)]">No recent battles</p>
            </CardContent></Card>
          )}
          {arenaStats?.recentBattles?.map(b => (
            <Card key={b.battleId}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="text-xl">
                  {b.result === 'team_won' ? 'ðŸ›¡ï¸' : 'âš”ï¸'}
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm text-white">
                    {b.challengerName}
                    <span className={`ml-2 text-xs ${b.result === 'team_won' ? 'text-red-400' : 'text-green-400'}`}>
                      {b.result === 'team_won' ? 'DEFEATED' : 'VICTORIOUS'}
                    </span>
                  </div>
                  <div className="text-xs text-[hsl(45_15%_45%)] mt-0.5">
                    Battle {b.battleId.slice(0, 12)}â€¦ â€¢ {timeAgo(b.timestamp)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-[hsl(43_60%_50%)] uppercase tracking-wider">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <a href="https://grudgewarlords.com" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Gamepad2 className="w-4 h-4 mr-1" /> Play Game</Button>
          </a>
          <a href="https://grudgewarlords.com/arena.html" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Swords className="w-4 h-4 mr-1" /> Arena Page</Button>
          </a>
          <a href="https://grudgewarlords.com/weapon-skill-tree.html" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Shield className="w-4 h-4 mr-1" /> Weapon Atlas</Button>
          </a>
          <a href="https://grudgewarlords.com/compendium.html" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><Globe className="w-4 h-4 mr-1" /> Compendium</Button>
          </a>
          <a href="https://discord.gg/FtGtmxmwkh" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">ðŸ’¬ Discord</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

