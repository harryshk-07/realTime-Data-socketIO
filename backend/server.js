const express = require('express');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
const cors = require("cors")

const app = express();
app.use(cors())
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000", // Replace with your frontend's URL
      methods: ["GET", "POST"]
    }
  });

const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb://localhost:27017/mern_socketio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>{
    console.log("MongoDB Connected")
}).catch((error)=>{
console.log(error)
})

const Message = mongoose.model('Message', {
  text: String,
});

io.on('connection', (socket) => {
    console.log('A user connected');
    console.log("UserID: ",socket.id)
    // Send existing messages to the connected client
    Message.find().then((messages) => {
      socket.emit('getMessages', messages);
    });
  
    // Listen for new messages
    socket.on('sendMessage', (data) => {
      console.log('Received new message:', data);
      const message = new Message({ text: data });
      message.save().then(() => {
        console.log('Message saved:', message);
        io.emit('newMessage', message);
      }).catch((error) => {
        console.error('Error saving message:', error);
      });
    });
 
    // Listen for typing events
    socket.on('typing', () => {
        socket.broadcast.emit('typing', { userId: socket.id });
    });

    socket.on('stopTyping', () => {
        socket.broadcast.emit('stopTyping', { userId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
