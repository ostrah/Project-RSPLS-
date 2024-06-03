const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  player1: { type: Schema.Types.ObjectId, ref: 'User' },
  player2: { type: Schema.Types.ObjectId, ref: 'User' },
  move1: String,
  move2: String,
  result: String,
  status: { type: String, default: 'in-progress' }, // in-progress, finished
});

module.exports = mongoose.model('Game', gameSchema);
