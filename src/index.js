require('dotenv').config({ path: 'variables.env' });

const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// TODO Use Express Middleware to handle cookies (JWT)
// TODO Use Express Middleware to populate current user

server.start({
  cors: {
    credential: true,
    origin: process.env.FRONTEND_URL,
  },
}, deets => {
  console.log(`Server is now running on Port:
  http://localhost:${deets.port}`);
});