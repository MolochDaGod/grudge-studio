# Puter.js Framework Integrations

Puter.js is framework-agnostic and works with any web framework.

## Installation

```bash
npm install @heyputer/puter.js
```

## React Integration

```jsx
import { useEffect } from "react";
import puter from "@heyputer/puter.js";

export function MyComponent() {
    useEffect(() => {
        puter.ai.chat("hello");
    }, [])
}
```

## Next.js Integration

```jsx
"use client";

import { useEffect } from "react";
import puter from "@heyputer/puter.js";

export function MyComponent() {
    useEffect(() => {
        puter.ai.chat("hello");
    }, [])
}
```

## Vue.js Integration

```vue
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

## CDN vs NPM

| Scenario | Use |
|----------|-----|
| Puter-hosted HTML files | CDN |
| React/Vue/Angular apps | NPM or CDN |
| Node.js backend | NPM with `init(authToken)` |
| Serverless workers | Global `puter` (auto-injected) |

## GRUDGE Warlords Usage

Our main React app loads Puter via CDN in `client/index.html`:
```html
<script src="https://js.puter.com/v2/"></script>
```
