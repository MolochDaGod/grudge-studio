# Puter.js Supported Platforms

Puter.js works on any platform with JavaScript support: websites, Puter Apps, Node.js, and Serverless Workers.

## Websites

Use Puter.js in websites to add AI, databases, and cloud storage without infrastructure concerns.

Works with: static HTML, SPAs (React, Vue, Angular), full-stack frameworks (Next.js, Nuxt, SvelteKit).

### NPM Installation

```bash
npm install @heyputer/puter.js
```

### Importing

```javascript
// ESM
import { puter } from "@heyputer/puter.js";
// or
import puter from "@heyputer/puter.js";

// CommonJS
const { puter } = require("@heyputer/puter.js");
// or
const puter = require("@heyputer/puter.js");
```

### CDN Usage

```html
<html>
<body>
    <script src="https://js.puter.com/v2/"></script>
    <script>
        puter.ai.chat("What is life?", { model: "gpt-5-nano" }).then(puter.print);
    </script>
</body>
</html>
```

### Starter Templates

| Framework | Repository |
|-----------|------------|
| Angular | https://github.com/HeyPuter/angular |
| React | https://github.com/HeyPuter/react |
| Next.js | https://github.com/HeyPuter/next.js |
| Vue.js | https://github.com/HeyPuter/vue.js |
| Vanilla JS | https://github.com/HeyPuter/vanilla.js |

## Puter Apps

Puter Apps are web-based applications that run in the Puter web-based operating system at https://puter.com.

### Benefits

- **Automatic authentication** - Users are automatically authenticated in the Puter environment
- **Inter-app communication** - Interact with other Puter apps programmatically
- **File system integration** - Direct access to the user's Puter file system
- **Cloud desktop integration** - Apps run seamlessly in the Puter desktop environment

The Puter ecosystem hosts over 60,000 live applications.

## Node.js (Beta)

Puter.js works in Node.js for backend services, APIs, server-side processing, and CLI tools.

```javascript
const { init } = require("@heyputer/puter.js/src/init.cjs");
// or
import { init } from "@heyputer/puter.js/src/init.cjs";

const puter = init(process.env.puterAuthToken); // uses your auth token

// Chat with AI
puter.ai.chat("What color was Napoleon's white horse?").then((response) => {
  puter.print(response);
});
```

Template: https://github.com/HeyPuter/node.js-express.js

## Serverless Workers

Workers let you run HTTP servers and backend APIs as serverless functions.

```javascript
// Simple GET endpoint
router.get("/api/hello", async ({ request }) => {
  return { message: "Hello, World!" };
});

// POST endpoint with JSON body
router.post("/api/user", async ({ request }) => {
  const body = await request.json();
  return { processed: true };
});
```

See `puter/docs/puter-workers.md` for full worker documentation.

## GRUDGE Warlords Platform Usage

Our project uses multiple platforms:

| Component | Platform | Why |
|-----------|----------|-----|
| `puter/index.html` | Puter App (CDN) | Auth service, hosted on Puter desktop |
| `puter/sprite-analyzer.html` | Puter App (CDN) | AI-powered tool, uses puter.ai |
| `client/src/lib/puter.ts` | Website (CDN) | React app running on Replit |
| Backend API | Node.js | Express server on Replit |

### CDN vs NPM Decision Guide

| Scenario | Use |
|----------|-----|
| Puter-hosted HTML files | CDN (`<script src="https://js.puter.com/v2/">`) |
| React/Vue/Angular on Replit | Either CDN (in index.html) or NPM import |
| Node.js backend | NPM with `init(authToken)` |
| Serverless workers | Global `puter` object (auto-injected) |

### Current Setup

Our main React app loads Puter via CDN in `client/index.html`:
```html
<script src="https://js.puter.com/v2/"></script>
```

This provides the global `window.puter` object that `client/src/lib/puter.ts` wraps with TypeScript types.

For future Node.js backend integration (if needed):
```javascript
import { init } from "@heyputer/puter.js/src/init.cjs";
const puter = init(process.env.PUTER_AUTH_TOKEN);
```
