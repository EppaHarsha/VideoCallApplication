const express=require('express');
const cors=require('cors');
const http=require('http');
const {Server}= require('socket.io')
const app=express();
const PORT=9000;
app.use(cors());
const server = http.createServer(app)
const io = new Server(server,{
    cors:{
        origin:"*",
        methods:['GET','POST']
    }
})

io.on("connection",(socket)=>{
    console.log("User connected",socket.id);
    socket.on("join-room",({roomId})=>{
        socket.join(roomId);
        console.log(`${socket.id} joined the room ${roomId}`);
        socket.to(roomId).emit("user-joined",socket.id);
    });

    socket.on("offer",({offer,roomId})=>{
        io.to(roomId).emit("offer-receiive",{offer,from:socket.id});
    });

    socket.on("answer",({answer,roomId})=>{
        socket.to(roomId).emit("answer-receive",{answer,from:socket.id})
    });

    socket.on("ice-candidate",({candidate,roomId})=>{
        socket.to(roomId).emit("ice-candidate",{candidate,from:socket.id});
    });

    socket.on("disconnect",()=>{
        console.log("User is disconected",socket.id);
    })
})

server.listen(PORT,()=>{
    console.log("Server is ruuning");
})