const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name: String,
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'waiting' }, // waiting, playing
});

module.exports = mongoose.model('Room', roomSchema);
