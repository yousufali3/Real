const express = require("express");
const app = express();

const http = require("http");
const path = require("path");
const server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const users = {}; // To keep track of user locations

io.on("connection", function (socket) {
  console.log("a new client connected");

  // Send current locations to the newly connected user
  socket.emit(
    "received-location",
    Object.entries(users).map(([id, { latitude, longitude }]) => ({
      id,
      latitude,
      longitude,
    }))
  );

  // Listen for location updates from clients
  socket.on("send-location", (data) => {
    users[socket.id] = data;
    io.emit("received-location", { id: socket.id, ...data });
  });

  // Handle user disconnection
  socket.on("disconnect", function () {
    io.emit("user-disconnected", socket.id);
    delete users[socket.id];
    console.log("client disconnected");
  });
});

app.get("/", function (req, res) {
  res.render("index");
});

server.listen(3000, () => {
  console.log(`server is running on port 3000`);
});
