const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const startChatFun = require('./routes/api/chat');
const redis = require('redis');
var cors = require('cors');
const dns = require('dns');
const initReidsConn = require('./startRedis');

app.use(cors());
// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

//app.get('/', (req, res) => res.send('API Running'));

// Defien Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

startChatFun(server);
initReidsConn;

const PORT = process.env.PORT || 8088;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
