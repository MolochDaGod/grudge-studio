# Puter Hosting API

Deploy and manage websites on Puter's infrastructure.

## Core Functions

### Create Hosting
```javascript
const site = await puter.hosting.create('my-subdomain');
console.log(`Site: https://${site.subdomain}.puter.site`);

// With directory
await puter.fs.mkdir('my-website');
await puter.fs.write('my-website/index.html', '<h1>Hello</h1>');
const site = await puter.hosting.create('my-subdomain', 'my-website');
```

### List All Sites
```javascript
const sites = await puter.hosting.list();
sites.forEach(site => console.log(`${site.subdomain}.puter.site`));
```

### Update Site
```javascript
await puter.hosting.update('my-subdomain', 'new-directory');
```

### Delete Site
```javascript
await puter.hosting.delete('my-subdomain');
```

## GRUDGE Deployment

| App | Subdomain | URL |
|-----|-----------|-----|
| grudge-auth | grudge-auth-73v97 | https://grudge-auth-73v97.puter.site |
| grudge-server | grudge-server-lwvwd | https://grudge-server-lwvwd.puter.site |
| GrudgeCloud | grudgecloud-85c9p | https://grudgecloud-85c9p.puter.site |
| grudge-studio | grudge-warlords | https://grudge-warlords.puter.site |
