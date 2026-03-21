const KV_KEYS = {
    accounts: 'grudge_accounts',
    sessions: 'grudge_sessions',
    onlinePlayers: 'grudge_online_players',
    activityLog: 'grudge_activity_log',
    adminEvents: 'grudge_admin_events'
};

const BACKEND_URL = 'https://api.grudge-studio.com';

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        if (path === '/api/health') {
            return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { headers });
        }

        if (path === '/api/accounts') {
            const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
            return new Response(JSON.stringify({ 
                success: true, 
                count: Object.keys(accounts).length,
                accounts: Object.keys(accounts).map(username => ({
                    username,
                    lastLogin: accounts[username].lastLogin,
                    role: accounts[username].role
                }))
            }), { headers });
        }

        if (path === '/api/online') {
            const onlinePlayers = await puter.kv.get(KV_KEYS.onlinePlayers) || {};
            return new Response(JSON.stringify({ 
                success: true, 
                count: Object.keys(onlinePlayers).length,
                players: Object.entries(onlinePlayers).map(([username, data]) => ({
                    username,
                    app: data.app,
                    connectedAt: data.connectedAt,
                    lastHeartbeat: data.lastHeartbeat
                }))
            }), { headers });
        }

        if (path === '/api/activity') {
            const logs = await puter.kv.get(KV_KEYS.activityLog) || [];
            const limit = parseInt(url.searchParams.get('limit') || '50');
            return new Response(JSON.stringify({ 
                success: true, 
                count: logs.length,
                logs: logs.slice(0, limit)
            }), { headers });
        }

        if (path === '/api/admin-events') {
            const events = await puter.kv.get(KV_KEYS.adminEvents) || [];
            const limit = parseInt(url.searchParams.get('limit') || '100');
            return new Response(JSON.stringify({ 
                success: true, 
                count: events.length,
                events: events.slice(0, limit)
            }), { headers });
        }

        if (path === '/api/register' && request.method === 'POST') {
            const body = await request.json();
            const { username, puterUuid, email } = body;

            if (!username || !puterUuid) {
                return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers });
            }

            const accounts = await puter.kv.get(KV_KEYS.accounts) || {};
            
            if (accounts[username]) {
                return new Response(JSON.stringify({ success: false, error: 'Username already exists' }), { status: 409, headers });
            }

            accounts[username] = {
                uuid: generateUUID(),
                puterUuid: puterUuid,
                username: username,
                email: email || null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                role: 'user',
                linkedApps: ['app-connection']
            };

            await puter.kv.set(KV_KEYS.accounts, accounts);

            await syncToBackend('register', accounts[username]);

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Account created',
                account: { username, uuid: accounts[username].uuid }
            }), { headers });
        }

        if (path === '/api/sync-to-backend' && request.method === 'POST') {
            const body = await request.json();
            const result = await syncToBackend(body.action, body.data);
            return new Response(JSON.stringify(result), { headers });
        }

        if (path === '/api/relay-admin' && request.method === 'POST') {
            const body = await request.json();
            const events = await puter.kv.get(KV_KEYS.adminEvents) || [];
            
            events.unshift({
                id: generateUUID(),
                timestamp: new Date().toISOString(),
                eventType: body.eventType,
                source: body.source || 'worker',
                user: body.user,
                data: body.data
            });

            if (events.length > 500) events.length = 500;
            await puter.kv.set(KV_KEYS.adminEvents, events);

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (path === '/api/cleanup-stale') {
            const onlinePlayers = await puter.kv.get(KV_KEYS.onlinePlayers) || {};
            const staleThreshold = 5 * 60 * 1000;
            const now = Date.now();
            let cleaned = 0;

            for (const [username, data] of Object.entries(onlinePlayers)) {
                const lastHeartbeat = new Date(data.lastHeartbeat || data.connectedAt).getTime();
                if (now - lastHeartbeat > staleThreshold) {
                    delete onlinePlayers[username];
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                await puter.kv.set(KV_KEYS.onlinePlayers, onlinePlayers);
            }

            return new Response(JSON.stringify({ 
                success: true, 
                cleaned,
                remaining: Object.keys(onlinePlayers).length
            }), { headers });
        }

        return new Response(JSON.stringify({ 
            error: 'Not found',
            availableEndpoints: [
                'GET /api/health',
                'GET /api/accounts',
                'GET /api/online',
                'GET /api/activity',
                'GET /api/admin-events',
                'POST /api/register',
                'POST /api/sync-to-backend',
                'POST /api/relay-admin',
                'GET /api/cleanup-stale'
            ]
        }), { status: 404, headers });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack
        }), { status: 500, headers });
    }
}

async function syncToBackend(action, data) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/puter-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data, timestamp: new Date().toISOString() })
        });
        
        if (response.ok) {
            return { success: true, synced: true };
        }
        return { success: true, synced: false, reason: 'Backend unavailable' };
    } catch (error) {
        return { success: true, synced: false, reason: error.message };
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default { fetch: handleRequest };
