# Puter.js Framework Integrations

Puter.js is framework-agnostic and works with any web framework.

## Installation

```bash
npm install @heyputer/puter.js
```

```javascript
import puter from "@heyputer/puter.js";

puter.ai.chat("hello world");
```

## React Integration

Import Puter.js and use it in your component:

```jsx
// MyComponent.jsx
import { useEffect } from "react";
import puter from "@heyputer/puter.js";

export function MyComponent() {
    useEffect(() => {
        puter.ai.chat("hello");
    }, [])
}
```

Template: https://github.com/HeyPuter/react

## Next.js Integration

Add the `"use client"` directive since Puter.js requires browser APIs:

```jsx
// MyComponent.jsx
"use client";

import { useEffect } from "react";
import puter from "@heyputer/puter.js";

export function MyComponent() {
    useEffect(() => {
        puter.ai.chat("hello");
    }, [])
}
```

**Note:** For Next.js 15 or earlier, enable Turbopack for Puter.js to work. Version 16+ has Turbopack enabled by default.

Template: https://github.com/HeyPuter/next.js

## Angular Integration

```typescript
// my-component.component.ts
import { Component } from "@angular/core";
import puter from "@heyputer/puter.js";

@Component({
    selector: "app-my-component",
    template: `<button (click)="handleClick()">Chat</button>`,
})
export class MyComponent {
    handleClick() {
        puter.ai.chat("hello");
    }
}
```

Template: https://github.com/HeyPuter/angular

## Vue.js Integration

```vue
<!-- MyComponent.vue -->
<script setup>
import puter from "@heyputer/puter.js";

function handleClick() {
    puter.ai.chat("hello");
}
</script>

<template>
    <button @click="handleClick">Chat</button>
</template>
```

Template: https://github.com/HeyPuter/vue.js

## Svelte Integration

```svelte
<!-- MyComponent.svelte -->
<script>
import puter from "@heyputer/puter.js";

function handleClick() {
    puter.ai.chat("hello");
}
</script>

<button on:click={handleClick}>Chat</button>
```

Template: https://github.com/HeyPuter/svelte

## Astro Integration

```html
<!-- Page.astro -->
<script>
    import puter from "@heyputer/puter.js";
    puter.ai.chat("hello");
</script>
```

Template: https://github.com/HeyPuter/astro

## CDN vs NPM

**For Puter-hosted apps (puter/index.html, etc.):**
- Use CDN: `<script src="https://js.puter.com/v2/"></script>`
- Access via global `puter` object

**For React/Vite apps:**
- Install NPM package: `npm install @heyputer/puter.js`
- Import: `import puter from "@heyputer/puter.js";`

## GRUDGE Warlords Usage

Our project uses both approaches:

| File | Method | Reason |
|------|--------|--------|
| `puter/index.html` | CDN | Static HTML hosted on Puter |
| `puter/sprite-analyzer.html` | CDN | Standalone tool |
| `client/src/lib/puter.ts` | NPM | React/Vite integration |

For the main React app, use the NPM package for proper TypeScript support and tree-shaking.
