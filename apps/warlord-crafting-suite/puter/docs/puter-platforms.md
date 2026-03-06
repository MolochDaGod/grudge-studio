# Puter.js Supported Platforms

Puter.js works on any platform with JavaScript support: websites, Puter Apps, Node.js, and Serverless Workers.

## Websites

Use Puter.js in websites to add AI, databases, and cloud storage without infrastructure concerns.

### NPM Installation
```bash
npm install @heyputer/puter.js
```

### Importing
```javascript
import puter from "@heyputer/puter.js";
```

### CDN Usage
```html
<script src="https://js.puter.com/v2/"></script>
```

## Puter Apps

Web-based applications running in the Puter desktop at https://puter.com.

Benefits:
- **Automatic authentication** - Users are authenticated in Puter environment
- **Inter-app communication** - Interact with other Puter apps
- **File system integration** - Direct access to user's Puter file system

## Node.js (Beta)

```javascript
const { init } = require("@heyputer/puter.js/src/init.cjs");
const puter = init(process.env.PUTER_AUTH_TOKEN);
puter.ai.chat("Hello").then(console.log);
```

## Serverless Workers

```javascript
router.get("/api/hello", async ({ request }) => {
  return { message: "Hello, World!" };
});
```

## GRUDGE Platform Usage

| Component | Platform | Method |
|-----------|----------|--------|
| `puter/apps/*` | Puter App | CDN |
| `client/src/*` | React/Vite | CDN in index.html |
| Backend API | Node.js | Express on Replit |
