const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const Room = require('../models/Room');
const Game = require('../models/Game');
const socket = require('../socket');
const router = express.Router();

// Настройка стратегии Passport
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Определение функции determineWinner
function determineWinner(move1, move2) {
  const outcomes = {
    rock: { scissors: 'wins', lizard: 'wins', rock: 'draw', paper: 'loses', spock: 'loses' },
    paper: { rock: 'wins', spock: 'wins', paper: 'draw', scissors: 'loses', lizard: 'loses' },
    scissors: { paper: 'wins', lizard: 'wins', scissors: 'draw', rock: 'loses', spock: 'loses' },
    lizard: { spock: 'wins', paper: 'wins', lizard: 'draw', rock: 'loses', scissors: 'loses' },
    spock: { scissors: 'wins', rock: 'wins', spock: 'draw', paper: 'loses', lizard: 'loses' }
  };

  const outcome = outcomes[move1][move2];

  if (outcome === 'wins') {
    return 'Player 1 Wins';
  } else if (outcome === 'loses') {
    return 'Player 2 Wins';
  } else {
    return 'Draw';
  }
}

// Маршрут для главной страницы
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.render('index', { rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Маршруты для регистрации
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  User.register(new User({ username }), password, (err, user) => {
    if (err) {
      console.error('Error registering user:', err);
      return res.render('register');
    }
    passport.authenticate('local')(req, res, () => {
      res.redirect('/');
    });
  });
});

// Маршруты для входа
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}));

// Маршрут для выхода
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
    }
    res.redirect('/login');
  });
});

// Маршруты для комнат
router.post('/rooms/create', isAuthenticated, async (req, res) => {
  try {
    const room = new Room({ name: `Room ${Date.now()}` });
    await room.save();
    console.log(`[${new Date().toISOString()}] Комната создана: ${room.name}`);
    res.redirect(`/rooms/${room._id}`);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/rooms/:id', isAuthenticated, async (req, res) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] Начало обработки запроса на комнату ${req.params.id}`);

  try {
    const room = await Room.findById(req.params.id).populate('players');
    if (!room) {
      console.log(`[${new Date().toISOString()}] Комната с ID ${req.params.id} не найдена`);
      return res.status(404).send('Комната не найдена');
    }

    console.log(`[${new Date().toISOString()}] Комната найдена: ${room.name}`);

    const isPlayerInRoom = room.players.some(player => player.equals(req.user._id));

    if (!isPlayerInRoom) {
      if (room.players.length < 2) {
        room.players.push(req.user._id);
        await room.save();
        console.log(`[${new Date().toISOString()}] Игрок: ${req.user.username} присоединился к комнате - ${room.name}`);
      } else {
        console.log(`[${new Date().toISOString()}] Комната уже заполнена: ${room.name}`);
        return res.status(400).send('Комната уже заполнена');
      }
    } else {
      console.log(`[${new Date().toISOString()}] Игрок: ${req.user.username} уже в комнате - ${room.name}`);
    }

    console.log(`[${new Date().toISOString()}] Количество игроков в комнате - ${room.players.length}`);
    console.log(`[${new Date().toISOString()}] Игроки в комнате: ${room.players.map(player => player.username).join(', ')}`);

    if (room.players.length === 1) {
      console.log(`[${new Date().toISOString()}] Ожидается второй игрок в комнате - ${room.name}`);
      console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
      return res.render('room', { room, user: req.user, waiting: true });
    } else if (room.players.length === 2) {
      if (room.status !== 'playing') {
        room.status = 'playing';
        await room.save();

        const game = new Game({
          room: room._id,
          player1: room.players[0],
          player2: room.players[1],
        });
        await game.save();

        console.log(`[${new Date().toISOString()}] Игра началась в комнате - ${room.name}`);
        console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
        return res.redirect(`/games/${game._id}`);
      } else {
        const game = await Game.findOne({ room: room._id, status: 'in-progress' });
        if (game) {
          console.log(`[${new Date().toISOString()}] Перенаправление на существующую игру в комнате - ${room.name}`);
          console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
          return res.redirect(`/games/${game._id}`);
        } else {
          console.log(`[${new Date().toISOString()}] Игра в комнате - ${room.name} не найдена`);
          console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
          return res.status(404).send('Игра не найдена');
        }
      }
    } else {
      console.log(`[${new Date().toISOString()}] Неверное состояние: комната - ${room.name}, количество игроков - ${room.players.length}`);
      console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
      return res.status(400).send('Invalid room state');
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ошибка при обработке запроса на комнату: ${error.message}`);
    console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
    res.status(500).send('Internal Server Error');
  }
});

// Новый маршрут для проверки состояния комнаты
router.get('/rooms/:id/status', isAuthenticated, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).send('Room not found');
    }

    res.json({ status: room.status });
  } catch (error) {
    console.error('Error fetching room status:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Маршруты для игры
router.get('/games/:id', isAuthenticated, async (req, res) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] Начало обработки запроса на игру ${req.params.id}`);

  try {
    const game = await Game.findById(req.params.id).populate('player1').populate('player2');
    if (!game) {
      console.log(`[${new Date().toISOString()}] Игра с ID ${req.params.id} не найдена`);
      return res.status(404).send('Игра не найдена');
    }

    console.log(`[${new Date().toISOString()}] Игра найдена`);
    console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
    res.render('game', { game, user: req.user });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ошибка при обработке запроса на игру: ${error.message}`);
    console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/games/:id/move', isAuthenticated, async (req, res) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] Начало обработки хода для игры ${req.params.id}`);

  try {
    const game = await Game.findById(req.params.id).populate('player1').populate('player2');
    const { move } = req.body;

    if (!game) {
      console.log(`[${new Date().toISOString()}] Игра с ID ${req.params.id} не найдена`);
      return res.status(404).send('Игра не найдена');
    }

    console.log(`[${new Date().toISOString()}] Игра найдена: ${game._id}`);
    console.log(`[${new Date().toISOString()}] Игроки: ${game.player1.username} vs ${game.player2.username}`);
    console.log(`[${new Date().toISOString()}] Ход: ${move}`);

    if (game.player1.equals(req.user._id)) {
      game.move1 = move;
      console.log(`[${new Date().toISOString()}] Игрок 1 сделал ход: ${move}`);
    } else if (game.player2.equals(req.user._id)) {
      game.move2 = move;
      console.log(`[${new Date().toISOString()}] Игрок 2 сделал ход: ${move}`);
    }

    await game.save();

    if (game.move1 && game.move2) {
      console.log(`[${new Date().toISOString()}] Оба хода сделаны: ${game.move1} vs ${game.move2}`);
      const result = determineWinner(game.move1, game.move2);
      game.result = result;
      game.status = 'finished';

      // Очистка комнаты после завершения игры
      const room = await Room.findById(game.room);
      room.status = 'waiting';
      room.players = [];
      await room.save();

      console.log(`[${new Date().toISOString()}] Игра завершена: ${result}`);
      const io = socket.getIo();
      console.log(`[${new Date().toISOString()}] Отправка события gameEnded через WebSocket`);
      io.to(room._id.toString()).emit('gameEnded', { result, game });

      // Сохранение результата игры для будущей статистики
      await game.save();
    } else {
      console.log(`[${new Date().toISOString()}] Ожидание второго хода`);
    }

    console.log(`[${new Date().toISOString()}] Ход сохранен`);
    console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
    res.redirect(`/games/${game._id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ошибка при обработке хода для игры: ${error.message}`);
    console.log(`[${new Date().toISOString()}] Время обработки: ${Date.now() - start}ms`);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
