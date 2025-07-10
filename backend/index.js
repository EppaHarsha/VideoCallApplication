const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const PORT = 9000;
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
let roomUsers = {};

io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);
    console.log("user joined");
    socket.data.userName = userName;
    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push(socket.id);
    console.log(`${socket.id} joined the room ${roomId}`);

    const otherUsers = roomUsers[roomId].filter((id) => id !== socket.id);
    console.log(otherUsers);

    const usersData = otherUsers.map((id) => ({
      userId: id,
      userName: io.sockets.sockets.get(id)?.data?.userName || "User",
    }));

    socket.emit("all-users", usersData);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
      userName,
    });

    socket.on("signal", ({ to, from, signal }) => {
      io.to(to).emit("signal", { from, signal });
    });
  });

  socket.on("disconnect", () => {
    //socket.to(roomId).emit("user-left",{userId:socket.id});
  });
});

server.listen(PORT, () => {
  console.log("Server is ruuning");
});
