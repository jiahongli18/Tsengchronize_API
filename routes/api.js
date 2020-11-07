const express = require("express");
const router = express.Router();
const User = require("../models/user");
const SpotifyWebApi = require("spotify-web-api-node");

const scopes = [
  "user-read-private",
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-modify-playback-state"
];

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_API_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.CALLBACK_URL
});

router.use("/static", express.static("./static/"));

router.get("/", (request, response) => {
  response.sendFile("/app/views/index.html");
});

router.get("/login", (req, res) => {
  var html = spotifyApi.createAuthorizeURL(scopes);
  console.log(html);
  res.redirect(html + "&show_dialog=true");
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  const customPlaylistObj = [];
  try {
    let data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    let result = await spotifyApi.getMe();
    let userImage =
      result.body.images[0] === undefined ? "" : result.body.images[0].url;

    let username = result.body.display_name;

    // Get a user's playlists and put them into the database
    try {
      let playlistsObj = await spotifyApi.getUserPlaylists();
      let playlists = playlistsObj.body.items;

      playlists.forEach(playlist =>
        customPlaylistObj.push({ id: playlist.id, playlist: playlist.name })
      );
    } catch (err) {
      console.log(err);
    }

    //put the user into the database, overwrite entry if it is already in there
    // executes, passing results to callback
    // const results = await User.findById(roomID);
    await User.find({ username: username }, function(err, users) {
      if (!users.find(usersElements => usersElements.username === username)) {
        User.create(
          {
            username: username,
            userImage: userImage,
            access_token: access_token,
            curr_song: "",
            next_song: "",
            chosen_playlist:
              customPlaylistObj[
                Math.floor(Math.random() * customPlaylistObj.length)
              ].id, //choose random song from playlist
            playlists: customPlaylistObj
          },
          function(err, instance) {
            if (err) return err;
          }
        );
      } else {
        //just update the access_token
        console.log("here");
        User.findOneAndUpdate(
          { username: username },
          { access_token: access_token },
          { returnNewDocument: true }
        )
          .then(updatedDocument => {
            if (updatedDocument) {
              console.log(`Successfully updated document: ${updatedDocument}.`);
            } else {
              console.log("No document matches the provided query.");
            }
          })
          .catch(err =>
            console.error(`Failed to find and update document: ${err}`)
          );
      }
    });

    //redirect to app if there is no error
    location.href = "Tsengchronize://";
    // res.sendFile("/app/views/pickPlaylist.html");
    // res.redirect("http://localhost:3001/home");
  } catch (err) {
    console.log(err);
    res.redirect("/#/error/invalid token");
  }
});

//display all the avaliable users with their information from the database
router.get("/availableUsers", async (req, res) => {
  try {
    await User.find({}, function(err, users) {
      if (!err) {
        res.status(200).send({ users: users });
      }
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

//endpoint for getting the playlist for a room, takes room id as a parameter in the request
router.get("/getPlaylist", async (req, res) => {
  let roomID = req.query.id;
  let results = await User.findById(roomID);

  spotifyApi.setAccessToken(results.access_token);
  spotifyApi.getPlaylist(results.chosen_playlist).then(
    function(data) {
      res.status(200).send(data.body);
    },
    function(err) {
      res.status(400).send(err);
    }
  );
});

module.exports = router;
