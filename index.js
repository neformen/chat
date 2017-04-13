var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000;
var io = require('socket.io');
var users = [];
var messageLogs = []; //save last 10 messages

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);

io = io(server);

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

  if (user.name) {
    socket.broadcast.emit('chat message', greetingMessage);
    messageLogs.unshift(greetingMessage);
    messageLogs.splice(9);
  }

  socket.on('chat message', function (msgObj) {

    if (msgObj.idTo) {
      socket.broadcast.to(msgObj.idTo).emit('chat message', msgObj.message);
    } else if (msgObj.file) {
      io.emit('chat file', msgObj);
    } else {
      socket.broadcast.emit('chat message', msgObj.message);
      messageLogs.unshift(msgObj.message);
      messageLogs.splice(9);
    }
  });

  socket.on('start typing', function (user) {
    socket.broadcast.emit('start typing', user);
  });

  socket.on('stop typing', function (user) {
    socket.broadcast.emit('stop typing', user);
  });

  socket.broadcast.emit('new user', user);
  socket.emit('init all users', users);

  socket.emit('chat message',  messageLogs.reverse());

  socket.on('disconnect', function() {
    socket.broadcast.emit('chat message', ByeMessage);
    messageLogs.unshift(ByeMessage);
    messageLogs.splice(9);

    let index = users.indexOf(user);
    users.splice(index, 1);

    io.emit('delete user', user);
  });
});

server.listen(port);