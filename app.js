const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const http = require('http');
const socket = require('./socket');

const app = express();
const server = http.createServer(app);

// Подключение к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Настройка сессий
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
}));

// Настройка Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Настройка Body Parser
app.use(bodyParser.urlencoded({ extended: false }));

// Настройка EJS
app.set('view engine', 'ejs');

// Настройка статических файлов
app.use(express.static('public'));

// Подключение маршрутов
app.use('/', authRoutes);

// Инициализация Socket.IO
const io = socket.init(server);

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
