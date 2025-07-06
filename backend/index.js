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
  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push(socket.id);
    console.log(`${socket.id} joined the room ${roomId}`);
    
    const otherUsers = roomUsers[roomId].filter((id) => id !== socket.id);
    socket.emit("all-users", otherUsers);
  });

  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer-receive", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    socket.to(to).emit("answer-receive", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnect", () => {
    for (const roomId in roomUsers) {
      roomUsers[roomId] = roomUsers[roomId].filter((id) => id !== socket.id);

      
      if (roomUsers[roomId].length === 0) {
        delete roomUsers[roomId];
      }
    }
    console.log("User disconnected", socket.id);
    console.log("User is disconected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("Server is ruuning");
});
