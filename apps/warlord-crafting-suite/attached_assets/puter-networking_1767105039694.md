# Puter Networking API

Network connections directly from the browser without CORS restrictions.

## Overview

The Networking API provides:
- **CORS-free fetch**: Make requests to any API without proxy
- **TCP Sockets**: Low-level network connections
- **TLS Sockets**: Secure encrypted connections

## Fetch (CORS-Free)

### Basic GET Request
```javascript
const response = await puter.net.fetch("https://api.example.com/data");
const data = await response.json();
```

### POST with JSON
```javascript
const response = await puter.net.fetch("https://api.example.com/submit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({ key: 'value' })
});
const result = await response.json();
```

### Response Types
```javascript
// JSON
const json = await response.json();

// Text
const text = await response.text();

// Blob
const blob = await response.blob();

// ArrayBuffer
const buffer = await response.arrayBuffer();
```

## GRUDGE Integration Examples

### Call External API Without CORS
```javascript
async function fetchExternalData() {
    try {
        const response = await puter.net.fetch('https://external-api.com/data');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}
```

### Cross-Origin Authentication
```javascript
async function authenticateWithExternalService(credentials) {
    const response = await puter.net.fetch('https://auth.external.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
        const { token } = await response.json();
        return token;
    }
    throw new Error('Authentication failed');
}
```

### Fetch Game Assets from CDN
```javascript
async function loadAssetFromCDN(assetPath) {
    const cdnUrl = `https://cdn.example.com/assets/${assetPath}`;
    const response = await puter.net.fetch(cdnUrl);
    return await response.blob();
}
```

## TCP Socket

### Basic Socket Connection
```javascript
const socket = new puter.net.Socket("example.com", 80);

socket.on("open", () => {
    console.log("Connected!");
    socket.write("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n");
});

const decoder = new TextDecoder();
socket.on("data", (data) => {
    console.log("Received:", decoder.decode(data));
});

socket.on("error", (reason) => {
    console.error("Socket error:", reason);
});

socket.on("close", (hadError) => {
    console.log("Socket closed, error:", hadError);
});
```

## TLS Socket (Secure)

### Secure Connection
```javascript
const socket = new puter.net.tls.TLSSocket("secure.example.com", 443);

socket.on("tlsopen", () => {
    console.log("TLS Connected!");
    socket.write("GET / HTTP/1.1\r\nHost: secure.example.com\r\n\r\n");
});

const decoder = new TextDecoder();
socket.on("tlsdata", (data) => {
    console.log("Received:", decoder.decode(data));
});

socket.on("error", (reason) => {
    console.error("TLS error:", reason);
});

socket.on("tlsclose", (hadError) => {
    console.log("TLS closed, error:", hadError);
});
```

## Best Practices

1. **Use fetch for HTTP**: Simpler than raw sockets
2. **Handle errors**: Always catch network failures
3. **Use TLS for sensitive data**: Never send credentials over plain TCP
4. **Set timeouts**: Prevent hanging connections
5. **Check response status**: Don't assume success

## Use Cases for GRUDGE

- Calling third-party game APIs without CORS issues
- Integrating payment providers
- Real-time game server connections
- CDN asset loading
- Analytics and telemetry
