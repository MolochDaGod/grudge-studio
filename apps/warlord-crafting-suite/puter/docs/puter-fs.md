# Puter File System (FS) API

Cloud storage operations for GRUDGE Warlords using Puter.js.

## Core Functions

### Write File
```javascript
await puter.fs.write('saves/character.json', JSON.stringify(data));
await puter.fs.write('sprites/hero.png', imageBlob, { dedupeName: true });
await puter.fs.write('deep/path/file.txt', 'content', { createMissingParents: true });
```

### Read File
```javascript
const blob = await puter.fs.read('saves/character.json');
const content = await blob.text();
const data = JSON.parse(content);
```

### Create Directory
```javascript
await puter.fs.mkdir('sprites');
await puter.fs.mkdir('assets/sprites/characters', { createMissingParents: true });
```

### List Directory
```javascript
const items = await puter.fs.readdir('sprites');
items.forEach(item => {
    console.log(`${item.name} - ${item.is_dir ? 'Dir' : 'File'}`);
});
```

### File Operations
```javascript
await puter.fs.rename('old.txt', 'new.txt');
await puter.fs.copy('source.txt', 'dest/');
await puter.fs.move('source.txt', 'dest/');
await puter.fs.delete('unwanted.txt');
```

### Get File Info
```javascript
const info = await puter.fs.stat('character.json');
console.log(`Size: ${info.size}, Created: ${info.created}`);
```

## Error Handling

```javascript
try {
    await puter.fs.read('nonexistent.txt');
} catch (error) {
    if (error.code === 'subject_does_not_exist') {
        console.log('File not found');
    }
}
```
