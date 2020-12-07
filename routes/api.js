const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Location = require("../models/location");
const SpotifyWebApi = require("spotify-web-api-node");
const CryptoJS = require("crypto-js");
const axios = require("axios");

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
    let locationObj;

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

    //get Location Lat, Long
    await Location.find({}, function(err, locations) {
      if (!err) {
        locationObj = locations[0];
      }
    });

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
            songVotes: [],
            chosen_playlist:
              customPlaylistObj[
                Math.floor(Math.random() * customPlaylistObj.length)
              ].id, //choose random song from playlist
            playlists: customPlaylistObj,
            location: locationObj
          },
          function(err, instance) {
            if (err) return err;
          }
        );
      } else {
        //just update the access_token
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
    // location.href = "Tsengchronize://";
    // res.sendFile("/app/views/pickPlaylist.html");
    res.redirect("Tsengchronize://");
  } catch (err) {
    console.log(err);
    // location.href = "Tsengchronize://";
    res.redirect("Tsengchronize://");
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
  console.log(results.access_token);

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

router.post("/addLocation", async (req, res) => {
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;

  Location.findOneAndUpdate(
    {},
    { latitude: latitude, longitude: longitude },
    function(err, result) {
      if (err) {
        res.send(err);
      } else {
        if (!result) {
          Location.create({
            latitude: latitude,
            longitude: longitude
          });
        }
        res.send(result);
      }
    }
  );
});

router.post("/voteSong", async (req, res) => {
  let id = req.body.id;
  let trackID = req.body.trackID;
  let voteType = req.body.voteType;

  let result = await User.findById(id).exec();
  let songVotesArr = result.songVotes;
  let songObj = songVotesArr.find(song => song.trackID === trackID);

  if (songObj) {
    voteType === "upvote" ? songObj.voteCount++ : songObj.voteCount--;
  } else {
    songVotesArr.push({
      trackID: trackID,
      voteCount: 1
    });
  }

  User.findOneAndUpdate({ _id: id }, { songVotes: songVotesArr }, function(
    err,
    result
  ) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).send("success");
    }
  });
});

router.post("/queueSong", async (req, res) => {
  let id = req.body.id;
  let songID = req.body.songID;

  await User.find({ _id: id }, function(err, user) {
    //resume playback first(queue won't work unless user is listening to music already)
    var config = {
      method: "put",
      url: "https://api.spotify.com/v1/me/player/play",
      headers: {
        Authorization: `Bearer ${user[0].access_token}`
      }
    };

    axios(config)
      .then(function(response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function(error) {
        console.log(error);
      });

    //queue song
    config = {
      method: "post",
      url: `https://api.spotify.com/v1/me/player/queue?uri=${songID}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${user[0].access_token}`
      }
    };

    axios(config)
      .then(function(response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function(error) {
        console.log(error);
      });
  });

  //delete song from our queue
  let result = await User.findById(id).exec();
  let songVotesArr = result.songVotes;

  songVotesArr.splice(
    songVotesArr.findIndex(song => song.trackID === songID),
    1
  );

  User.findOneAndUpdate({ _id: id }, { songVotes: songVotesArr }, function(
    err,
    result
  ) {
    if (err) {
      res.send(err);
    } else {
      res.status(200).send("success");
    }
  });
});

//display all the avaliable locations with their information from the database
router.get("/getLocation", async (req, res) => {
  await Location.find({}, function(err, locations) {
    if (!err) {
      res.status(200).send(locations[0]);
    }
  });
});

module.exports = router;
