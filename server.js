// Save this code in a file named server.js

const http = require('http');

const PORT = 8000;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Handle requests...
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
