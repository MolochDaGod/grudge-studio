# GRUDGE Social API - Account Schema

## Account Fields

```javascript
{
  // Identity
  grudgeUuid: "ACCT-LX5ABCD-7G2HJK",  // GRUDGE-specific UUID
  puterUuid: "puter-uuid-here",        // Puter account UUID
  username: "playerName",              // Unique username
  displayName: "Player Name",          // Display name
  email: "player@email.com",           // Optional email
  
  // Timestamps
  createdAt: "2025-01-02T...",
  lastLogin: "2025-01-02T...",
  lastSeen: "2025-01-02T...",
  
  // Role & Access
  role: "user",  // user, premium, admin, developer, guest
  linkedApps: ["app-connection", "studio"],
  cloudAccess: true,
  
  // Progression
  level: 1,
  xp: 0,
  gold: 100,
  gems: 0,
  
  // PvP & Game Stats
  stats: {
    pvpWins: 0,
    pvpLosses: 0,
    pvpRating: 1000,      // ELO-style rating
    gamesPlayed: 0,
    itemsCrafted: 0,
    tradesCompleted: 0
  },
  
  // Privacy Settings
  settings: {
    showOnline: true,
    allowFriendRequests: true,
    allowDirectMessages: "friends",  // friends, all, none
    notifications: true
  },
  
  // Wallet
  walletAddress: "0x..."  // Optional linked wallet
}
```

## API Endpoints

### Account Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/account/register` | POST | Create new account |
| `/api/account/get?uuid=` | GET | Get account by UUID |
| `/api/account/update` | PUT | Update account fields |

### Friends System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/friends/list?uuid=` | GET | Get friends list with online status |
| `/api/friends/request` | POST | Send friend request |
| `/api/friends/accept` | POST | Accept friend request |
| `/api/friends/reject` | POST | Reject friend request |
| `/api/friends/remove` | POST | Remove friend |
| `/api/friends/block` | POST | Block user |
| `/api/friends/pending?uuid=` | GET | Get pending requests |

### Online Status
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/online/status` | POST | Update online status |
| `/api/online/list` | GET | Get all online players |

### Chat System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/send` | POST | Send message (DM or room) |
| `/api/chat/dm?user1=&user2=` | GET | Get DM history |
| `/api/chat/room?roomId=` | GET | Get room chat history |

### Custom Lobbies
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lobby/create` | POST | Create custom lobby |
| `/api/lobby/list` | GET | List public lobbies |
| `/api/lobby/join` | POST | Join a lobby |
| `/api/lobby/leave` | POST | Leave a lobby |
| `/api/lobby/get?id=` | GET | Get lobby details |

### PvP System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pvp/queue` | POST | Join PvP matchmaking queue |
| `/api/pvp/match?uuid=` | GET | Check for active match |
| `/api/pvp/result` | POST | Submit match result |

### Wallet Integration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/get?uuid=` | GET | Get wallet info |
| `/api/wallet/link` | POST | Link external wallet |

### Notifications
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications?uuid=` | GET | Get notifications |
| `/api/notifications/clear` | POST | Clear notifications |

## Puter KV Storage Keys

```javascript
const KV_KEYS = {
  accounts: 'grudge_accounts',           // All accounts
  friends: 'grudge_friends',             // Friend lists per user
  friendRequests: 'grudge_friend_requests',
  blockedUsers: 'grudge_blocked_users',
  onlinePlayers: 'grudge_online_players',
  directMessages: 'grudge_dm_',          // Per conversation
  roomMessages: 'grudge_room_messages_', // Per room
  lobbies: 'grudge_lobbies',             // All lobbies
  pvpMatches: 'grudge_pvp_matches',      // Match records
  pvpQueue: 'grudge_pvp_queue',          // Matchmaking queue
  wallets: 'grudge_wallets',             // Linked wallets
  notifications: 'grudge_notifications_' // Per user
};
```

## UUID Formats

- **Account**: `ACCT-{timestamp36}-{random6}`
- **Lobby**: `LBBY-{timestamp36}-{random6}`
- **Match**: `MTCH-{timestamp36}-{random6}`

## Lobby Schema

```javascript
{
  id: "LBBY-LX5...",
  name: "Player's Lobby",
  type: "custom",           // custom, arena, trading, crafting
  host: "username",
  hostUuid: "uuid",
  maxPlayers: 8,
  players: ["user1", "user2"],
  settings: {},             // Custom game settings
  isPrivate: false,
  passwordHash: null,       // If password protected
  createdAt: "...",
  status: "waiting"         // waiting, active, closed
}
```

## PvP Match Schema

```javascript
{
  id: "MTCH-LX5...",
  mode: "1v1",
  players: ["player1", "player2"],
  ratings: { player1: 1000, player2: 1050 },
  createdAt: "...",
  status: "pending",        // pending, active, completed
  winner: null,
  completedAt: null
}
```

## Notification Types

- `friend_request` - New friend request
- `friend_accepted` - Friend request accepted
- `message` - New direct message
- `pvp_match` - PvP match found
- `lobby_invite` - Lobby invitation
- `system` - System notification
