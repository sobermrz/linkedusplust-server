let express = require('express');
const app = express();
const path = require('path');
const User = require('../../models/User');

const startChatFun = (server) => {
  //const server = require('http').createServer(app);
  let io = require('socket.io')(server);

  let onlineUsersSocketId = {};

  //監聽 Server 連線後的所有事件，並捕捉事件 socket 執行
  io.on('connection', (socket) => {
    console.log('New socket id coming in: ' + socket.id);
    console.log('');

    socket.on('user_login', ({ userId, socketId }) => {
      console.log('------------Server receied: ------------');
      console.log('User Id: ', userId);
      console.log('Socket Id: ', socketId);
      console.log('----------------------------------------');
      socket.userId = userId;
      onlineUsersSocketId[userId] = socketId;
    });

    socket.on('disconnect', function () {
      console.log(socket.userId, 'is disconnected!');
      delete onlineUsersSocketId[socket.userId];
    });

    //監聽透過 connection 傳進來的事件
    socket.on('getMessage', (message) => {
      const { from, to, msg } = message;

      console.log('reveived msg: ', from, 'to', to, ':', msg);

      saveMsg(Object.assign({}, message));

      //回傳 message 給發送訊息的 Client
      //socket.emit('getMessage', message);
      message.me = false;
      saveMsg(Object.assign({}, message));
      //TO DO: 發送給特定目標 透過userId 來查找其socket Id，並傳送訊息給該ID
      if (onlineUsersSocketId[message.to]) {
        io.sockets.connected[onlineUsersSocketId[message.to]].emit(
          'getMessage',
          message
        );
      }
    });
  });
};

// Save Msg To Database
const saveMsg = async (msg) => {
  const { me, to, from } = msg;
  let user = null;
  if (me) {
    user = await User.findById(from);
    if (user.allMsgData.get(to)) {
      user.allMsgData.set(to, [...user.allMsgData.get(to), msg]);
    } else {
      //user.allMsgData[to] = [msg];
      user.allMsgData.set(to, [msg]);
    }
  } else {
    user = await User.findById(to);
    if (user.allMsgData.get(from)) {
      user.allMsgData.set(from, [...user.allMsgData.get(from), msg]);
    } else {
      user.allMsgData.set(from, [msg]);
    }
  }

  await user.save();
  console.log('message saved!');
};

module.exports = startChatFun;
