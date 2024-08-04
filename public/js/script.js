document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("send-location", { latitude, longitude });
      },
      (error) => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }

  const map = L.map("map").setView([0, 0], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Yousuf Ali",
  }).addTo(map);

  const markers = {};

  socket.on("received-location", ({ id, latitude, longitude }) => {
    if (markers[id]) {
      markers[id].setLatLng([latitude, longitude]);
    } else {
      markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Adjust map view to fit all markers
    // const latLngs = Object.values(markers).map((marker) => marker.getLatLng());
    // if (latLngs.length > 0) {
    //   const bounds = L.latLngBounds(latLngs);
    //   map.fitBounds(bounds);
    // }
  });

  socket.on("user-disconnected", (id) => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  });
});
