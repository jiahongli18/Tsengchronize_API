const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//create user schema & model
const UserSchema = new Schema({
  username: String,
  userImage: String,
  access_token: String,
  curr_song: String,
  next_song: String,
  chosen_playlist: String,
  playlists: [
    {
      id: String,
      playlist: String
    }
  ]
});

const User = mongoose.model('User', UserSchema)

module.exports = User;