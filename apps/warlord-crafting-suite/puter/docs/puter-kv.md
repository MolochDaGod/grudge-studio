# Puter Key-Value Store API

Fast, persistent key-value storage in the cloud.

## Quick Reference

| Method | Description |
|--------|-------------|
| `puter.kv.set(key, value)` | Store a value |
| `puter.kv.get(key)` | Retrieve a value |
| `puter.kv.del(key)` | Delete a key |
| `puter.kv.list(pattern?, withValues?)` | List keys |
| `puter.kv.incr(key, amount?)` | Increment counter |
| `puter.kv.decr(key, amount?)` | Decrement counter |
| `puter.kv.expire(key, seconds)` | Set key expiration |
| `puter.kv.flush()` | Delete ALL keys |

---

## Set Value

Store a key-value pair.

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    puter.kv.set('name', 'Puter Smith').then((success) => {
        console.log('Key-value pair created/updated:', success);
    });
</script>
```

### Storing JSON Objects

Always stringify objects before storing:

```javascript
// Store object
await puter.kv.set('user_data', JSON.stringify({ 
    name: 'Hero', 
    level: 10,
    inventory: ['sword', 'shield']
}));

// Retrieve object
const data = JSON.parse(await puter.kv.get('user_data'));
console.log(data.name); // 'Hero'
```

---

## Get Value

Retrieve a stored value.

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    (async () => {
        // Create a key-value pair
        await puter.kv.set('name', 'Puter Smith');
        console.log("Key-value pair 'name' created/updated");

        // Retrieve the value
        const name = await puter.kv.get('name');
        console.log('Name is:', name);
    })();
</script>
```

### Handle Missing Keys

```javascript
const value = await puter.kv.get('maybe_missing');
if (value) {
    console.log('Found:', value);
} else {
    console.log('Key not found');
}

// Or with default value
const data = JSON.parse(await puter.kv.get('config') || '{"default": true}');
```

---

## Increment / Decrement

Atomic counter operations (prevents race conditions).

### Increment

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    puter.kv.incr('login_count').then((newValue) => {
        console.log(`New value: ${newValue}`);
    });
</script>
```

### Decrement

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    puter.kv.decr('lives_remaining').then((newValue) => {
        console.log(`New value: ${newValue}`);
    });
</script>
```

### With Custom Amount

```javascript
// Increment by 5
await puter.kv.incr('score', 5);

// Decrement by 10
await puter.kv.decr('health', 10);
```

---

## List Keys

List all keys or filter by pattern.

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    (async () => {
        // Create key-value pairs
        await puter.kv.set('name', 'Puter Smith');
        await puter.kv.set('age', 21);
        await puter.kv.set('isCool', true);
        console.log("Key-value pairs created");

        // List all keys
        const keys = await puter.kv.list();
        console.log(`Keys are: ${keys}`);

        // List all keys WITH values
        const keyVals = await puter.kv.list(true);
        keyVals.forEach(item => {
            console.log(`${item.key} => ${item.value}`);
        });

        // Match keys with pattern (glob)
        const matchingKeys = await puter.kv.list('is*');
        console.log(`Keys matching 'is*': ${matchingKeys}`);

        // Cleanup
        await puter.kv.del('name');
        await puter.kv.del('age');
        await puter.kv.del('isCool');
    })();
</script>
```

### Pattern Matching

```javascript
// All keys starting with 'user_'
const userKeys = await puter.kv.list('user_*');

// All keys starting with 'grudge_session_'
const sessions = await puter.kv.list('grudge_session_*', true);
sessions.forEach(s => console.log(s.key, JSON.parse(s.value)));
```

---

## Delete Key

Remove a single key.

```javascript
await puter.kv.del('temporary_data');
```

---

## Expire

Set a key to automatically delete after a specified time.

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    (async () => {
        // Create a key-value pair
        await puter.kv.set('temp_token', 'abc123');
        console.log("Key 'temp_token' created");

        // Set key to expire in 60 seconds
        await puter.kv.expire('temp_token', 60);
        console.log("Key will expire in 60 seconds");

        // After expiration, get returns null
        setTimeout(async () => {
            const value = await puter.kv.get('temp_token');
            console.log("Value after expiry:", value); // null
        }, 61000);
    })();
</script>
```

### Session Expiration Example

```javascript
// Create session with 10-minute expiration
const sessionId = crypto.randomUUID();
await puter.kv.set(`grudge_session_${sessionId}`, JSON.stringify({
    userId: user.id,
    username: user.username,
    createdAt: Date.now()
}));
await puter.kv.expire(`grudge_session_${sessionId}`, 7200); // 2 hours
```

---

## Flush (Delete All)

**WARNING:** This deletes ALL keys in your KV store!

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    (async () => {
        // Create some keys
        await puter.kv.set('key1', 'value1');
        await puter.kv.set('key2', 'value2');

        // List before flush
        const before = await puter.kv.list();
        console.log('Keys before:', before);

        // Flush ALL keys
        await puter.kv.flush();
        console.log('Key-value store flushed');

        // List after flush (empty)
        const after = await puter.kv.list();
        console.log('Keys after:', after); // []
    })();
</script>
```

---

## Interactive Example

Remember user's name across sessions:

```html
<script src="https://js.puter.com/v2/"></script>
<script>
    puter.kv.get('name').then(name => {
        if (name) {
            document.write('Welcome back, ' + name);
        } else {
            let newName = prompt("What's your name?");
            if (newName) {
                puter.kv.set('name', newName).then(() => {
                    document.write('Nice to meet you, ' + newName);
                });
            }
        }
    });
</script>
```

---

## Worker Context

In Puter Workers, use `me.puter.kv` for developer-owned storage:

```javascript
router.get('/api/data', async () => {
    // Read from developer's KV store
    const data = await me.puter.kv.get('game_config');
    return JSON.parse(data || '{}');
});

router.post('/api/save', async ({ request }) => {
    const body = await request.json();
    // Write to developer's KV store
    await me.puter.kv.set('game_config', JSON.stringify(body));
    return { success: true };
});
```

---

## GRUDGE Key Namespaces

| Prefix | Purpose | TTL |
|--------|---------|-----|
| `grudge_session_` | Auth sessions | 2 hours |
| `grudge_npc_` | NPC memory | Permanent |
| `grudge_job_` | Background jobs | Until complete |
| `grudge_data_` | Cached game data | Permanent |
| `grudge_asset_` | Asset metadata | Permanent |

---

## Best Practices

### 1. Always Stringify Objects

```javascript
// WRONG - stores "[object Object]"
await puter.kv.set('data', { key: 'value' });

// CORRECT
await puter.kv.set('data', JSON.stringify({ key: 'value' }));
```

### 2. Handle Null Values

```javascript
const raw = await puter.kv.get('maybe_missing');
const data = raw ? JSON.parse(raw) : { default: true };
```

### 3. Use Namespaced Keys

```javascript
// WRONG - generic key may conflict
await puter.kv.set('session', token);

// CORRECT - namespaced
await puter.kv.set(`grudge_session_${sessionId}`, JSON.stringify(session));
```

### 4. Use Atomic Operations for Counters

```javascript
// WRONG - race condition possible
const count = parseInt(await puter.kv.get('count') || '0');
await puter.kv.set('count', count + 1);

// CORRECT - atomic
await puter.kv.incr('count');
```

### 5. Set Expiration for Temporary Data

```javascript
await puter.kv.set('temp_code', code);
await puter.kv.expire('temp_code', 300); // 5 minutes
```
