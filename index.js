var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000;
var io = require('socket.io');

app.use(express.static(__dirname + "/"))

var server = http.createServer(app);

io = io(server);

var users = [];

var messageLogs = [];


io.use(function(socket, next) {
  if (socket.handshake.query.user) {
    let name = socket.handshake.query.user,
        id = socket.id;
    
    users.push({name,id});
  }
  next();
});


io.on('connection', function (socket) {
  let user = {
        name: socket.handshake.query.user,
        id: socket.id
      },
      greetingMessage = `${user.name} join the chat`,
      ByeMessage = `${user.name} leave the chat`

  
  user.name && socket.broadcast.emit('chat message', greetingMessage);
  messageLogs.unshift(greetingMessage);

  socket.on('chat message', function (msgObj) {

    if (msgObj.idTo) {
      socket.broadcast.to(msgObj.idTo).emit('chat message', msgObj.message);
    } else if (msgObj.img) {
      io.emit('chat image', msgObj);
    } else {
      socket.broadcast.emit('chat message', msgObj.message);
      messageLogs.unshift(msgObj.message);
      messageLogs.splice(9);
    }
  });

  socket.on('start typing', function (nickname) {
    io.emit('start typing', nickname);
  });

  socket.on('stop typing', function (nickname) {
    io.emit('stop typing', nickname);
  });

  io.emit('new user', users);

  socket.emit('chat message',  messageLogs.reverse());

  socket.on('disconnect', function() {
    user.name && socket.broadcast.emit('chat message', ByeMessage);
    messageLogs.unshift(ByeMessage);
    messageLogs.splice(9);

    let index = users.indexOf(user);
    users.splice(index, 1);

    io.emit('new user', users);
  });
});

server.listen(port);