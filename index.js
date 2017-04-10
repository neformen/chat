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
  socket.handshake.query.user && users.push(socket.handshake.query.user);
  console.log(users);
  next();
});


io.on('connection', function (socket) {
  console.log(socket.handshake.query.user);
  io.emit('new user', 1);
  socket.on('chat message', function (msg) {
    io.emit('chat message', msg);
  });
});

server.listen(port);