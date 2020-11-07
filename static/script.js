const SpotifyWebApi = require("spotify-web-api-node");

const scopes = [
  "user-read-private",
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private"
];

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_API_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.CALLBACK_URL
});

let access_token =
  "BQAgZqDB3TOYHnJ5QvEOljKYYtDHgVPL73bKJvXdF7NCLDMwWoW8GphRKfjNqtI97uVpk-IqaPpRTdFUVnqZWCqksnLHCuS-Jb5VUCvcPXcu2Jkbf5zFZvxWExnSV09Q5sJUkg_TC9bTvUEizgN-VJtgJYFJHsbbqfIRykWxa4wxn46jx1HmZcdHtThcAZcE8AlRRQLjgza9PgxGdTyB_2ihlIVT";
spotifyApi.setAccessToken(access_token);

spotifyApi.getUserPlaylists("Jack Li").then(
  function(data) {
    console.log("Retrieved playlists", data.body);
  },
  function(err) {
    console.log("Something went wrong!", err);
  }
);

// data.items.map(function(artist) {
//   let item = $("<button>" + artist.name + "</button>");
//   item.appendTo($("#top-artists"));
// });
