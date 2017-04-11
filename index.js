var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000;
var io = require('socket.io');

app.use(express.static(__dirname + "/"))

var server = http.createServer(app);

io = io(server);

var users = [];


io.use(function(socket, next) {
  console.log("Query: ", socket.handshake.query);

  if (socket.handshake.query.user) {
    let name = socket.handshake.query.user,
        id = socket.id;
    
    users.push({name,id});
  }
  console.log(users);
  next();
});


io.on('connection', function (socket) {
  let user = {
        name: socket.handshake.query.user,
        id: socket.id
      },
      greetingMessage = `${user.name} join the chat`,
      ByeMessage = `${user.name} leave the chat`

  
  user.name && io.emit('chat message', greetingMessage);

  socket.on('chat message', function (msgObj) {
    if (msgObj.idTo) {
      socket.broadcast.to(msgObj.idTo).emit('chat message', msgObj.message);
    } else {
      socket.broadcast.emit('chat message', msgObj.message);
    }
  });

  socket.on('start typing', function (nickname) {
    io.emit('start typing', nickname);
  });

  socket.on('stop typing', function (nickname) {
    io.emit('stop typing', nickname);
  });

  io.emit('new user', users);

  socket.on('disconnect', function() {
    user.name && io.emit('chat message', ByeMessage);

    let index = users.indexOf(user);
    users.splice(index, 1);

    io.emit('new user', users);
  });
});

server.listen(port);