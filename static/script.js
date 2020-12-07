var longitude;
var latitude;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLocation(url) {
  const success = async function(position) {
    console.log(position);
    longitude = position.coords.longitude;
    latitude = position.coords.latitude;

    let locationData = {
      latitude: latitude,
      longitude: longitude
    };

    await fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(locationData)
    });
  };
  const failure = function(message) {
    alert("Cannot retrieve location!");
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, failure);
    await sleep(5000);
  } else {
    alert("Geolocation not supported");
  }
}

getLocation("https://tsengchronize.glitch.me/addLocation").then(() => {
  window.location.href = "https://tsengchronize.glitch.me/login2";
});
