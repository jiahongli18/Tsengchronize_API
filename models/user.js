const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//create user schema & model
const UserSchema = new Schema({
  username: String,
  userImage: String,
  access_token: String,
  songVotes: [
    {
      trackID: String,
      voteCount: Number
    }
  ],
  chosen_playlist: String,
  playlists: [
    {
      id: String,
      playlist: String
    }
  ],
  location: [
    {
      latitude: String,
      longitude: String
    }
  ]
});

const User = mongoose.model('User', UserSchema)

module.exports = User;