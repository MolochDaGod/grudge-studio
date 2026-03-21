const KV_KEYS = {
    accounts: 'grudge_accounts',
    friends: 'grudge_friends',
    friendRequests: 'grudge_friend_requests',
    blockedUsers: 'grudge_blocked_users',
    onlinePlayers: 'grudge_online_players',
    directMessages: 'grudge_dm_',
    roomMessages: 'grudge_room_messages_',
    lobbies: 'grudge_lobbies',
    pvpMatches: 'grudge_pvp_matches',
    pvpQueue: 'grudge_pvp_queue',
    activityLog: 'grudge_activity_log',
    adminEvents: 'grudge_admin_events',
    wallets: 'grudge_wallets',
    notifications: 'grudge_notifications_'
};

const BACKEND_URL = 'https://api.grudge-studio.com';

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-UUID'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        if (path === '/api/health') {
            return jsonResponse({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() }, headers);
        }

        if (path === '/api/account/register' && request.method === 'POST') {
            return await registerAccount(await request.json(), headers);
        }

        if (path === '/api/account/get') {
            const uuid = url.searchParams.get('uuid');
            return await getAccount(uuid, headers);
        }

        if (path === '/api/account/update' && request.method === 'PUT') {
            return await updateAccount(await request.json(), headers);
        }

        if (path === '/api/friends/list') {
            const uuid = url.searchParams.get('uuid');
            return await getFriendsList(uuid, headers);
        }

        if (path === '/api/friends/request' && request.method === 'POST') {
            return await sendFriendRequest(await request.json(), headers);
        }

        if (path === '/api/friends/accept' && request.method === 'POST') {
            return await acceptFriendRequest(await request.json(), headers);
        }

        if (path === '/api/friends/reject' && request.method === 'POST') {
            return await rejectFriendRequest(await request.json(), headers);
        }

        if (path === '/api/friends/remove' && request.method === 'POST') {
            return await removeFriend(await request.json(), headers);
        }

        if (path === '/api/friends/block' && request.method === 'POST') {
            return await blockUser(await request.json(), headers);
        }

        if (path === '/api/friends/pending') {
            const uuid = url.searchParams.get('uuid');
            return await getPendingRequests(uuid, headers);
        }

        if (path === '/api/online/status' && request.method === 'POST') {
            return await updateOnlineStatus(await request.json(), headers);
        }

        if (path === '/api/online/list') {
            return await getOnlinePlayers(headers);
        }

        if (path === '/api/chat/send' && request.method === 'POST') {
            return await sendMessage(await request.json(), headers);
        }

        if (path === '/api/chat/dm') {
            const user1 = url.searchParams.get('user1');
            const user2 = url.searchParams.get('user2');
            const limit = parseInt(url.searchParams.get('limit') || '50');
            return await getDirectMessages(user1, user2, limit, headers);
        }

        if (path === '/api/chat/room') {
            const roomId = url.searchParams.get('roomId');
            const limit = parseInt(url.searchParams.get('limit') || '100');
            return await getRoomMessages(roomId, limit, headers);
        }

        if (path === '/api/lobby/create' && request.method === 'POST') {
            return await createLobby(await request.json(), headers);
        }

        if (path === '/api/lobby/list') {
            const type = url.searchParams.get('type');
            return await listLobbies(type, headers);
        }

        if (path === '/api/lobby/join' && request.method === 'POST') {
            return await joinLobby(await request.json(), headers);
        }

        if (path === '/api/lobby/leave' && request.method === 'POST') {
            return await leaveLobby(await request.json(), headers);
        }

        if (path === '/api/lobby/get') {
            const lobbyId = url.searchParams.get('id');
            return await getLobby(lobbyId, headers);
        }

        if (path === '/api/pvp/queue' && request.method === 'POST') {
            return await joinPvPQueue(await request.json(), headers);
        }

        if (path === '/api/pvp/match') {
            const uuid = url.searchParams.get('uuid');
            return await checkPvPMatch(uuid, headers);
        }

        if (path === '/api/pvp/result' && request.method === 'POST') {
            return await submitPvPResult(await request.json(), headers);
        }

        if (path === '/api/wallet/get') {
            const uuid = url.searchParams.get('uuid');
            return await getWallet(uuid, headers);
        }

        if (path === '/api/wallet/link' && request.method === 'POST') {
            return await linkWallet(await request.json(), headers);
        }

        if (path === '/api/notifications') {
            const uuid = url.searchParams.get('uuid');
            return await getNotifications(uuid, headers);
        }

        if (path === '/api/notifications/clear' && request.method === 'POST') {
            return await clearNotifications(await request.json(), headers);
        }

        return jsonResponse({ 
            error: 'Not found',
            availableEndpoints: [
                'GET /api/health',
                'POST /api/account/register',
                'GET /api/account/get?uuid=',
                'PUT /api/account/update',
                'GET /api/friends/list?uuid=',
                'POST /api/friends/request',
                'POST /api/friends/accept',
                'POST /api/friends/reject',
                'POST /api/friends/remove',
                'POST /api/friends/block',
                'GET /api/friends/pending?uuid=',
                'POST /api/online/status',
                'GET /api/online/list',
                'POST /api/chat/send',
                'GET /api/chat/dm?user1=&user2=',
                'GET /api/chat/room?roomId=',
                'POST /api/lobby/create',
                'GET /api/lobby/list',
                'POST /api/lobby/join',
                'POST /api/lobby/leave',
                'GET /api/lobby/get?id=',
                'POST /api/pvp/queue',
                'GET /api/pvp/match?uuid=',
                'POST /api/pvp/result',
                'GET /api/wallet/get?uuid=',
                'POST /api/wallet/link',
                'GET /api/notifications?uuid=',
                'POST /api/notifications/clear'
            ]
        }, headers, 404);

    } catch (error) {
        return jsonResponse({ error: error.message }, headers, 500);
    }
}

async function registerAccount(data, headers) {
    const { username, puterUuid, email, displayName } = data;

    if (!username || !puterUuid) {
        return jsonResponse({ success: false, error: 'Missing required fields' }, headers, 400);
    }

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    if (accounts[username]) {
        return jsonResponse({ success: false, error: 'Username already exists' }, headers, 409);
    }

    const grudgeUuid = generateGrudgeUUID('ACCT');
    
    accounts[username] = {
        grudgeUuid: grudgeUuid,
        puterUuid: puterUuid,
        username: username,
        displayName: displayName || username,
        email: email || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        role: 'user',
        level: 1,
        xp: 0,
        gold: 100,
        gems: 0,
        stats: {
            pvpWins: 0,
            pvpLosses: 0,
            pvpRating: 1000,
            gamesPlayed: 0,
            itemsCrafted: 0,
            tradesCompleted: 0
        },
        settings: {
            showOnline: true,
            allowFriendRequests: true,
            allowDirectMessages: 'friends',
            notifications: true
        },
        walletAddress: null,
        linkedApps: ['app-connection'],
        cloudAccess: true
    };

    await puter.kv.set(KV_KEYS.accounts, accounts);

    const friends = await puter.kv.get(KV_KEYS.friends) || {};
    friends[username] = [];
    await puter.kv.set(KV_KEYS.friends, friends);

    await logActivity('account_created', username, { grudgeUuid });

    return jsonResponse({ 
        success: true, 
        account: {
            username,
            grudgeUuid,
            displayName: accounts[username].displayName
        }
    }, headers);
}

async function getAccount(uuid, headers) {
    if (!uuid) {
        return jsonResponse({ success: false, error: 'UUID required' }, headers, 400);
    }

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    let account = null;
    for (const [username, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            account = { ...acc, username };
            break;
        }
    }

    if (!account) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const publicAccount = {
        username: account.username,
        displayName: account.displayName,
        grudgeUuid: account.grudgeUuid,
        level: account.level,
        stats: account.stats,
        lastSeen: account.lastSeen,
        role: account.role
    };

    return jsonResponse({ success: true, account: publicAccount }, headers);
}

async function updateAccount(data, headers) {
    const { uuid, updates } = data;

    if (!uuid || !updates) {
        return jsonResponse({ success: false, error: 'UUID and updates required' }, headers, 400);
    }

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const allowedFields = ['displayName', 'settings', 'walletAddress'];
    for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
            if (key === 'settings') {
                accounts[username].settings = { ...accounts[username].settings, ...updates.settings };
            } else {
                accounts[username][key] = updates[key];
            }
        }
    }

    await puter.kv.set(KV_KEYS.accounts, accounts);

    return jsonResponse({ success: true }, headers);
}

async function getFriendsList(uuid, headers) {
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const friends = await puter.kv.get(KV_KEYS.friends) || {};
    const onlinePlayers = await puter.kv.get(KV_KEYS.onlinePlayers) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const userFriends = friends[username] || [];
    
    const friendsList = userFriends.map(friendName => {
        const friendAcc = accounts[friendName];
        if (!friendAcc) return null;
        
        return {
            username: friendName,
            displayName: friendAcc.displayName,
            level: friendAcc.level,
            isOnline: !!onlinePlayers[friendName],
            lastSeen: friendAcc.lastSeen,
            currentApp: onlinePlayers[friendName]?.app || null
        };
    }).filter(Boolean);

    return jsonResponse({ success: true, friends: friendsList }, headers);
}

async function sendFriendRequest(data, headers) {
    const { fromUuid, toUsername } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const requests = await puter.kv.get(KV_KEYS.friendRequests) || {};
    const blocked = await puter.kv.get(KV_KEYS.blockedUsers) || {};
    const friends = await puter.kv.get(KV_KEYS.friends) || {};
    
    let fromUsername = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === fromUuid || acc.puterUuid === fromUuid) {
            fromUsername = name;
            break;
        }
    }

    if (!fromUsername) {
        return jsonResponse({ success: false, error: 'Sender not found' }, headers, 404);
    }

    if (!accounts[toUsername]) {
        return jsonResponse({ success: false, error: 'User not found' }, headers, 404);
    }

    if (fromUsername === toUsername) {
        return jsonResponse({ success: false, error: 'Cannot add yourself' }, headers, 400);
    }

    if ((friends[fromUsername] || []).includes(toUsername)) {
        return jsonResponse({ success: false, error: 'Already friends' }, headers, 400);
    }

    if ((blocked[toUsername] || []).includes(fromUsername)) {
        return jsonResponse({ success: false, error: 'Cannot send request' }, headers, 403);
    }

    if (!requests[toUsername]) requests[toUsername] = [];
    
    if (requests[toUsername].some(r => r.from === fromUsername)) {
        return jsonResponse({ success: false, error: 'Request already pending' }, headers, 400);
    }

    requests[toUsername].push({
        from: fromUsername,
        sentAt: new Date().toISOString()
    });

    await puter.kv.set(KV_KEYS.friendRequests, requests);

    await addNotification(toUsername, 'friend_request', {
        from: fromUsername,
        message: `${fromUsername} sent you a friend request`
    });

    return jsonResponse({ success: true }, headers);
}

async function acceptFriendRequest(data, headers) {
    const { uuid, fromUsername } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const requests = await puter.kv.get(KV_KEYS.friendRequests) || {};
    const friends = await puter.kv.get(KV_KEYS.friends) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const userRequests = requests[username] || [];
    const requestIndex = userRequests.findIndex(r => r.from === fromUsername);
    
    if (requestIndex === -1) {
        return jsonResponse({ success: false, error: 'Request not found' }, headers, 404);
    }

    userRequests.splice(requestIndex, 1);
    requests[username] = userRequests;

    if (!friends[username]) friends[username] = [];
    if (!friends[fromUsername]) friends[fromUsername] = [];
    
    friends[username].push(fromUsername);
    friends[fromUsername].push(username);

    await puter.kv.set(KV_KEYS.friendRequests, requests);
    await puter.kv.set(KV_KEYS.friends, friends);

    await addNotification(fromUsername, 'friend_accepted', {
        from: username,
        message: `${username} accepted your friend request`
    });

    return jsonResponse({ success: true }, headers);
}

async function rejectFriendRequest(data, headers) {
    const { uuid, fromUsername } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const requests = await puter.kv.get(KV_KEYS.friendRequests) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const userRequests = requests[username] || [];
    requests[username] = userRequests.filter(r => r.from !== fromUsername);

    await puter.kv.set(KV_KEYS.friendRequests, requests);

    return jsonResponse({ success: true }, headers);
}

async function removeFriend(data, headers) {
    const { uuid, friendUsername } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const friends = await puter.kv.get(KV_KEYS.friends) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    friends[username] = (friends[username] || []).filter(f => f !== friendUsername);
    friends[friendUsername] = (friends[friendUsername] || []).filter(f => f !== username);

    await puter.kv.set(KV_KEYS.friends, friends);

    return jsonResponse({ success: true }, headers);
}

async function blockUser(data, headers) {
    const { uuid, blockUsername } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const blocked = await puter.kv.get(KV_KEYS.blockedUsers) || {};
    const friends = await puter.kv.get(KV_KEYS.friends) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    if (!blocked[username]) blocked[username] = [];
    if (!blocked[username].includes(blockUsername)) {
        blocked[username].push(blockUsername);
    }

    friends[username] = (friends[username] || []).filter(f => f !== blockUsername);
    friends[blockUsername] = (friends[blockUsername] || []).filter(f => f !== username);

    await puter.kv.set(KV_KEYS.blockedUsers, blocked);
    await puter.kv.set(KV_KEYS.friends, friends);

    return jsonResponse({ success: true }, headers);
}

async function getPendingRequests(uuid, headers) {
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const requests = await puter.kv.get(KV_KEYS.friendRequests) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const pending = (requests[username] || []).map(req => ({
        from: req.from,
        displayName: accounts[req.from]?.displayName || req.from,
        level: accounts[req.from]?.level || 1,
        sentAt: req.sentAt
    }));

    return jsonResponse({ success: true, requests: pending }, headers);
}

async function updateOnlineStatus(data, headers) {
    const { uuid, app, status } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const onlinePlayers = await puter.kv.get(KV_KEYS.onlinePlayers) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    if (status === 'offline') {
        delete onlinePlayers[username];
    } else {
        onlinePlayers[username] = {
            uuid: uuid,
            app: app || 'unknown',
            connectedAt: onlinePlayers[username]?.connectedAt || new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            status: status || 'online'
        };
    }

    accounts[username].lastSeen = new Date().toISOString();

    await puter.kv.set(KV_KEYS.onlinePlayers, onlinePlayers);
    await puter.kv.set(KV_KEYS.accounts, accounts);

    return jsonResponse({ success: true }, headers);
}

async function getOnlinePlayers(headers) {
    const onlinePlayers = await puter.kv.get(KV_KEYS.onlinePlayers) || {};
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    const players = Object.entries(onlinePlayers).map(([username, data]) => ({
        username,
        displayName: accounts[username]?.displayName || username,
        level: accounts[username]?.level || 1,
        app: data.app,
        status: data.status
    }));

    return jsonResponse({ success: true, count: players.length, players }, headers);
}

async function sendMessage(data, headers) {
    const { fromUuid, toUsername, roomId, text, type } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    let fromUsername = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === fromUuid || acc.puterUuid === fromUuid) {
            fromUsername = name;
            break;
        }
    }

    if (!fromUsername) {
        return jsonResponse({ success: false, error: 'Sender not found' }, headers, 404);
    }

    const message = {
        id: generateUUID(),
        from: fromUsername,
        text: text,
        timestamp: new Date().toISOString(),
        type: type || 'text'
    };

    if (roomId) {
        const roomKey = KV_KEYS.roomMessages + roomId;
        const messages = await puter.kv.get(roomKey) || [];
        messages.push(message);
        if (messages.length > 1000) messages.splice(0, messages.length - 1000);
        await puter.kv.set(roomKey, messages);
    } else if (toUsername) {
        const blocked = await puter.kv.get(KV_KEYS.blockedUsers) || {};
        if ((blocked[toUsername] || []).includes(fromUsername)) {
            return jsonResponse({ success: false, error: 'Cannot send message' }, headers, 403);
        }

        const dmKey = KV_KEYS.directMessages + [fromUsername, toUsername].sort().join('_');
        const messages = await puter.kv.get(dmKey) || [];
        messages.push({ ...message, to: toUsername });
        if (messages.length > 500) messages.splice(0, messages.length - 500);
        await puter.kv.set(dmKey, messages);

        await addNotification(toUsername, 'message', {
            from: fromUsername,
            preview: text.substring(0, 50)
        });
    }

    return jsonResponse({ success: true, messageId: message.id }, headers);
}

async function getDirectMessages(user1, user2, limit, headers) {
    const dmKey = KV_KEYS.directMessages + [user1, user2].sort().join('_');
    const messages = await puter.kv.get(dmKey) || [];
    
    return jsonResponse({ 
        success: true, 
        messages: messages.slice(-limit)
    }, headers);
}

async function getRoomMessages(roomId, limit, headers) {
    const roomKey = KV_KEYS.roomMessages + roomId;
    const messages = await puter.kv.get(roomKey) || [];
    
    return jsonResponse({ 
        success: true, 
        messages: messages.slice(-limit)
    }, headers);
}

async function createLobby(data, headers) {
    const { hostUuid, name, type, maxPlayers, settings, isPrivate, password } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const lobbies = await puter.kv.get(KV_KEYS.lobbies) || {};
    
    let hostUsername = null;
    for (const [username, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === hostUuid || acc.puterUuid === hostUuid) {
            hostUsername = username;
            break;
        }
    }

    if (!hostUsername) {
        return jsonResponse({ success: false, error: 'Host not found' }, headers, 404);
    }

    const lobbyId = generateGrudgeUUID('LBBY');
    
    lobbies[lobbyId] = {
        id: lobbyId,
        name: name || `${hostUsername}'s Lobby`,
        type: type || 'custom',
        host: hostUsername,
        hostUuid: hostUuid,
        maxPlayers: maxPlayers || 8,
        players: [hostUsername],
        settings: settings || {},
        isPrivate: isPrivate || false,
        passwordHash: password ? simpleHash(password) : null,
        createdAt: new Date().toISOString(),
        status: 'waiting'
    };

    await puter.kv.set(KV_KEYS.lobbies, lobbies);

    return jsonResponse({ success: true, lobbyId, lobby: lobbies[lobbyId] }, headers);
}

async function listLobbies(type, headers) {
    const lobbies = await puter.kv.get(KV_KEYS.lobbies) || {};
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    let lobbyList = Object.values(lobbies).filter(l => !l.isPrivate && l.status !== 'closed');
    
    if (type) {
        lobbyList = lobbyList.filter(l => l.type === type);
    }

    lobbyList = lobbyList.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        host: l.host,
        hostLevel: accounts[l.host]?.level || 1,
        playerCount: l.players.length,
        maxPlayers: l.maxPlayers,
        status: l.status,
        hasPassword: !!l.passwordHash
    }));

    return jsonResponse({ success: true, lobbies: lobbyList }, headers);
}

async function joinLobby(data, headers) {
    const { uuid, lobbyId, password } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const lobbies = await puter.kv.get(KV_KEYS.lobbies) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const lobby = lobbies[lobbyId];
    if (!lobby) {
        return jsonResponse({ success: false, error: 'Lobby not found' }, headers, 404);
    }

    if (lobby.players.length >= lobby.maxPlayers) {
        return jsonResponse({ success: false, error: 'Lobby is full' }, headers, 400);
    }

    if (lobby.passwordHash && simpleHash(password) !== lobby.passwordHash) {
        return jsonResponse({ success: false, error: 'Incorrect password' }, headers, 403);
    }

    if (!lobby.players.includes(username)) {
        lobby.players.push(username);
        lobbies[lobbyId] = lobby;
        await puter.kv.set(KV_KEYS.lobbies, lobbies);
    }

    return jsonResponse({ success: true, lobby }, headers);
}

async function leaveLobby(data, headers) {
    const { uuid, lobbyId } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const lobbies = await puter.kv.get(KV_KEYS.lobbies) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    const lobby = lobbies[lobbyId];
    if (!lobby) {
        return jsonResponse({ success: true }, headers);
    }

    lobby.players = lobby.players.filter(p => p !== username);

    if (lobby.host === username) {
        if (lobby.players.length > 0) {
            lobby.host = lobby.players[0];
        } else {
            lobby.status = 'closed';
        }
    }

    lobbies[lobbyId] = lobby;
    await puter.kv.set(KV_KEYS.lobbies, lobbies);

    return jsonResponse({ success: true }, headers);
}

async function getLobby(lobbyId, headers) {
    const lobbies = await puter.kv.get(KV_KEYS.lobbies) || {};
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    const lobby = lobbies[lobbyId];
    if (!lobby) {
        return jsonResponse({ success: false, error: 'Lobby not found' }, headers, 404);
    }

    const playersInfo = lobby.players.map(p => ({
        username: p,
        displayName: accounts[p]?.displayName || p,
        level: accounts[p]?.level || 1,
        isHost: p === lobby.host
    }));

    return jsonResponse({ 
        success: true, 
        lobby: { ...lobby, players: playersInfo, passwordHash: undefined }
    }, headers);
}

async function joinPvPQueue(data, headers) {
    const { uuid, mode, rating } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const queue = await puter.kv.get(KV_KEYS.pvpQueue) || {};
    
    let username = null;
    let userRating = 1000;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            userRating = acc.stats?.pvpRating || 1000;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const queueMode = mode || '1v1';
    if (!queue[queueMode]) queue[queueMode] = [];

    queue[queueMode] = queue[queueMode].filter(p => p.username !== username);

    queue[queueMode].push({
        username,
        uuid,
        rating: userRating,
        joinedAt: new Date().toISOString()
    });

    await puter.kv.set(KV_KEYS.pvpQueue, queue);

    const match = await tryMatchmaking(queueMode, username, userRating);

    return jsonResponse({ success: true, queued: true, match }, headers);
}

async function tryMatchmaking(mode, username, rating) {
    const queue = await puter.kv.get(KV_KEYS.pvpQueue) || {};
    const modeQueue = queue[mode] || [];

    if (modeQueue.length < 2) return null;

    const candidates = modeQueue
        .filter(p => p.username !== username)
        .filter(p => Math.abs(p.rating - rating) <= 200);

    if (candidates.length === 0) return null;

    const opponent = candidates[0];

    queue[mode] = modeQueue.filter(p => p.username !== username && p.username !== opponent.username);
    await puter.kv.set(KV_KEYS.pvpQueue, queue);

    const matchId = generateGrudgeUUID('MTCH');
    const matches = await puter.kv.get(KV_KEYS.pvpMatches) || {};
    
    matches[matchId] = {
        id: matchId,
        mode,
        players: [username, opponent.username],
        ratings: { [username]: rating, [opponent.username]: opponent.rating },
        createdAt: new Date().toISOString(),
        status: 'pending'
    };

    await puter.kv.set(KV_KEYS.pvpMatches, matches);

    await addNotification(opponent.username, 'pvp_match', {
        matchId,
        opponent: username
    });

    return matches[matchId];
}

async function checkPvPMatch(uuid, headers) {
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const matches = await puter.kv.get(KV_KEYS.pvpMatches) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const activeMatch = Object.values(matches).find(m => 
        m.players.includes(username) && 
        (m.status === 'pending' || m.status === 'active')
    );

    return jsonResponse({ success: true, match: activeMatch || null }, headers);
}

async function submitPvPResult(data, headers) {
    const { matchId, winnerUuid } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const matches = await puter.kv.get(KV_KEYS.pvpMatches) || {};
    
    const match = matches[matchId];
    if (!match) {
        return jsonResponse({ success: false, error: 'Match not found' }, headers, 404);
    }

    let winnerUsername = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === winnerUuid || acc.puterUuid === winnerUuid) {
            winnerUsername = name;
            break;
        }
    }

    const loserUsername = match.players.find(p => p !== winnerUsername);

    if (winnerUsername && accounts[winnerUsername]) {
        accounts[winnerUsername].stats.pvpWins++;
        accounts[winnerUsername].stats.gamesPlayed++;
        accounts[winnerUsername].stats.pvpRating += 25;
    }

    if (loserUsername && accounts[loserUsername]) {
        accounts[loserUsername].stats.pvpLosses++;
        accounts[loserUsername].stats.gamesPlayed++;
        accounts[loserUsername].stats.pvpRating = Math.max(0, accounts[loserUsername].stats.pvpRating - 20);
    }

    match.status = 'completed';
    match.winner = winnerUsername;
    match.completedAt = new Date().toISOString();

    matches[matchId] = match;
    await puter.kv.set(KV_KEYS.pvpMatches, matches);
    await puter.kv.set(KV_KEYS.accounts, accounts);

    return jsonResponse({ success: true, match }, headers);
}

async function getWallet(uuid, headers) {
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const wallets = await puter.kv.get(KV_KEYS.wallets) || {};
    
    let username = null;
    let account = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            account = acc;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    return jsonResponse({ 
        success: true, 
        wallet: {
            walletAddress: account.walletAddress,
            gold: account.gold,
            gems: account.gems,
            linkedWallets: wallets[username] || []
        }
    }, headers);
}

async function linkWallet(data, headers) {
    const { uuid, walletAddress, walletType } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    const wallets = await puter.kv.get(KV_KEYS.wallets) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    accounts[username].walletAddress = walletAddress;

    if (!wallets[username]) wallets[username] = [];
    wallets[username].push({
        address: walletAddress,
        type: walletType || 'unknown',
        linkedAt: new Date().toISOString()
    });

    await puter.kv.set(KV_KEYS.accounts, accounts);
    await puter.kv.set(KV_KEYS.wallets, wallets);

    return jsonResponse({ success: true }, headers);
}

async function getNotifications(uuid, headers) {
    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    const notifs = await puter.kv.get(KV_KEYS.notifications + username) || [];

    return jsonResponse({ success: true, notifications: notifs }, headers);
}

async function clearNotifications(data, headers) {
    const { uuid, notificationIds } = data;

    const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
    
    let username = null;
    for (const [name, acc] of Object.entries(accounts)) {
        if (acc.grudgeUuid === uuid || acc.puterUuid === uuid) {
            username = name;
            break;
        }
    }

    if (!username) {
        return jsonResponse({ success: false, error: 'Account not found' }, headers, 404);
    }

    let notifs = await puter.kv.get(KV_KEYS.notifications + username) || [];

    if (notificationIds && notificationIds.length > 0) {
        notifs = notifs.filter(n => !notificationIds.includes(n.id));
    } else {
        notifs = [];
    }

    await puter.kv.set(KV_KEYS.notifications + username, notifs);

    return jsonResponse({ success: true }, headers);
}

async function addNotification(username, type, data) {
    const notifs = await puter.kv.get(KV_KEYS.notifications + username) || [];
    
    notifs.unshift({
        id: generateUUID(),
        type,
        data,
        createdAt: new Date().toISOString(),
        read: false
    });

    if (notifs.length > 100) notifs.length = 100;

    await puter.kv.set(KV_KEYS.notifications + username, notifs);
}

async function logActivity(action, username, data = {}) {
    const logs = await puter.kv.get(KV_KEYS.activityLog) || [];
    
    logs.unshift({
        timestamp: new Date().toISOString(),
        action,
        username,
        data
    });

    if (logs.length > 5000) logs.length = 5000;

    await puter.kv.set(KV_KEYS.activityLog, logs);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateGrudgeUUID(prefix) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function jsonResponse(data, headers, status = 200) {
    return new Response(JSON.stringify(data), { status, headers });
}

export default { fetch: handleRequest };
