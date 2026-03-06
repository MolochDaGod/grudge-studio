# Puter Apps API

Create and manage Puter applications programmatically.

## App Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | string | Unique app identifier |
| `indexURL` | string | URL to app's main page |
| `title` | string | Display name |
| `description` | string | User-facing description |
| `icon` | string | App icon URL |
| `maximizeOnStart` | boolean | Start maximized |
| `filetypeAssociations` | array | File types app can open |
| `metadata` | object | Custom key-value data |

## Core Functions

### Create App
```javascript
const app = await puter.apps.create('grudge-crafting', 'https://grudge-crafting.puter.site');
```

### Update App
```javascript
const updated = await puter.apps.update('grudge-crafting', {
    title: 'GRUDGE Warlords Crafting',
    description: 'Craft weapons, armor, and potions!',
    metadata: { version: '2.5.0' }
});
```

### Get App Info
```javascript
const app = await puter.apps.get('grudge-crafting');
```

### List Apps
```javascript
const apps = await puter.apps.list();
```

### Delete App
```javascript
await puter.apps.delete('old-app-name');
```

## GRUDGE App Configuration

```javascript
const APP_CONFIG = {
    appName: 'grudge-warlords',
    indexUrl: 'https://grudge-warlords.puter.site',
    version: '2.5.0'
};

async function setupGrudgeApp() {
    try {
        await puter.apps.get(APP_CONFIG.appName);
        await puter.apps.update(APP_CONFIG.appName, {
            title: 'GRUDGE Warlords',
            indexURL: APP_CONFIG.indexUrl
        });
    } catch (e) {
        await puter.apps.create(APP_CONFIG.appName, APP_CONFIG.indexUrl);
    }
}
```
