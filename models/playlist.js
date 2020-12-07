const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//create user schema & model
const PlaylistSchema = new Schema({
  roomID: String,
  trackID: String,
  votes: String
});

const Playlist = mongoose.model('Playlist', PlaylistSchema)

module.exports = Playlist;