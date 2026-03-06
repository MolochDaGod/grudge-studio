# Puter Networking API

Network connections directly from the browser without CORS restrictions.

## Fetch (CORS-Free)

```javascript
const response = await puter.net.fetch("https://api.example.com/data");
const data = await response.json();

// POST with JSON
const response = await puter.net.fetch("https://api.example.com/submit", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TOKEN'
    },
    body: JSON.stringify({ key: 'value' })
});
```

## TCP Socket

```javascript
const socket = new puter.net.Socket("example.com", 80);

socket.on("open", () => {
    socket.write("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n");
});

socket.on("data", (data) => {
    console.log("Received:", new TextDecoder().decode(data));
});
```

## TLS Socket (Secure)

```javascript
const socket = new puter.net.tls.TLSSocket("secure.example.com", 443);

socket.on("tlsopen", () => {
    socket.write("GET / HTTP/1.1\r\nHost: secure.example.com\r\n\r\n");
});
```

## Use Cases for GRUDGE

- Calling third-party APIs without CORS issues
- Integrating payment providers
- Real-time game server connections
- CDN asset loading
