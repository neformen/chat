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
      messageObj = {
        user: user.name,
        messageText: 'start the chat'
      }
      historySize = 9,
      currentLogs = [];

  if (user.name) {
    socket.broadcast.emit('chat message', messageObj);
    messageLogs.unshift({
      message: messageObj,
      type: 'chat message'
    });
  }

  socket.on('chat message', function (msgObj) {

    if (msgObj.idTo) {
      socket.broadcast.to(msgObj.idTo).emit('chat message', msgObj);
      socket.emit('chat message', msgObj);
      messageLogs.unshift({
        message: msgObj,
        type: 'chat message'
      });
    } else {
      io.emit('chat message', msgObj);
      messageLogs.unshift({
        message: msgObj,
        type: 'chat message'
      });
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

  messageLogs.some((msgObj) => {
    if (msgObj.message.idTo === user.id || msgObj.message.idFrom === user.id) {
      currentLogs.unshift(msgObj);
    } else if (!(msgObj.message.idTo) && !(msgObj.message.idTo)) {
      currentLogs.unshift(msgObj);
    }

    return (currentLogs.length === historySize);
  });

  currentLogs.forEach((msgObj) => {
    socket.emit(msgObj.type, msgObj.message);
  });




  socket.on('disconnect', function() {
    let messageObj = {
      user: user.name,
      messageText: "leave the chat"
    };

    socket.broadcast.emit('chat message', messageObj);
    messageLogs.unshift({
      message: messageObj,
      type: 'chat message'
    });

    let index = users.indexOf(user);
    users.splice(index, 1);

    currentLogs = [];

    socket.broadcast.emit('delete user', user);
  });
});

server.listen(port);