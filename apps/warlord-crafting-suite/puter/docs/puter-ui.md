# Puter UI API

Create rich interfaces and interact with the Puter desktop environment.

## Authentication

```javascript
await puter.ui.authenticateWithPuter();

if (puter.auth.isSignedIn()) {
    const user = await puter.auth.getUser();
    console.log(`Welcome, ${user.username}!`);
}
```

## Dialogs

```javascript
await puter.ui.alert('Operation completed!');
const name = await puter.ui.prompt('Enter character name:');
```

## Window Management

```javascript
const window = await puter.ui.createWindow({
    url: 'https://example.com',
    title: 'Game Window',
    width: 800,
    height: 600
});

await puter.ui.setWindowTitle('GRUDGE Warlords');
```

## File Pickers

```javascript
const file = await puter.ui.showOpenFilePicker();
const saveFile = await puter.ui.showSaveFilePicker({ suggestedName: 'char.json' });
const dir = await puter.ui.showDirectoryPicker();
```

## System Integration

```javascript
await puter.ui.launchApp('code');
await puter.ui.exit();
const lang = await puter.ui.getLanguage();
```
