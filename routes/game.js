const express = require('express');
const { isAuthenticated } = require('./auth');
const Game = require('../models/Game');
const Room = require('../models/Room');
const { determineWinner } = require('../utils/gameLogic.js');
const router = express.Router();

// Маршруты для игры
router.get('/:id', isAuthenticated, async (req, res) => {
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

router.post('/:id/move', isAuthenticated, async (req, res) => {
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

    if (game.move1 && game.move2) {
      const result = determineWinner(game.move1, game.move2);
      game.result = result;
      game.status = 'finished';

      // Очистка комнаты после завершения игры
      const room = await Room.findById(game.room);
      room.status = 'waiting';
      room.players = [];
      await room.save();

      console.log(`[${new Date().toISOString()}] Игра завершена: ${result}`);
    }

    await game.save();
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
