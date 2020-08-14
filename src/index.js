const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });

const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Use Express Middleware to handle cookies (JWT)
server.express.use(cookieParser());

// Use Express Middleware to populate current user
// Decode the JWT so we cant get the User Id on each Request
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // Put the userId onto the req for future Requests to access
    req.userId = userId;
  }
  next();
});

server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  },
}, deets => {
  console.log(`Server is now running on Port:
  http://localhost:${deets.port}`);
});