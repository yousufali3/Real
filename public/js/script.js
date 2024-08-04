document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  const map = L.map("map").setView([0, 0], 10); // Set an initial view with a reasonable zoom level
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Yousuf Ali",
  }).addTo(map);

  const markers = {};

  // Function to center the map on a given location
  function centerMap(latitude, longitude) {
    map.setView([latitude, longitude], 16); // Adjust zoom level as needed
    if (!markers[socket.id]) {
      markers[socket.id] = L.marker([latitude, longitude]).addTo(map);
    } else {
      markers[socket.id].setLatLng([latitude, longitude]);
    }
  }

  // Get the user's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        centerMap(latitude, longitude);
        socket.emit("send-location", { latitude, longitude });
      },
      (error) => {
        console.log(error);
        // Handle error (e.g., show a message or use a default location)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
    // Handle the case where geolocation is not supported
  }

  // Update map with new location data from other users
  socket.on("received-location", ({ id, latitude, longitude }) => {
    if (markers[id]) {
      markers[id].setLatLng([latitude, longitude]);
    } else {
      markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Adjust map view to fit all markers if needed
    const latLngs = Object.values(markers).map((marker) => marker.getLatLng());
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] }); // Add padding to avoid excessive zoom
    }
  });

  socket.on("user-disconnected", (id) => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  });
});
