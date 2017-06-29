//
//
// エディタは CodeMirror
// https://codemirror.net/demo/marker.html
//
// Codemirror Component for React.js
// https://github.com/JedWatson/react-codemirror
// ReactでCodemirrorを使う
// https://memo.mmmpa.net/memo/6


const express = require('express');
const async = require('async');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

const cwd = '/Users/dreamarts/WebstormProjects/JavaSchool/data';
// const env = { LANG: 'C' };

app.use(express.static('public'));

// app.get(`/`, (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });


const spawn = require('child_process').spawn;

const javac = spawn('javac', ['MyProg01.java', '-g'], { cwd });
javac.on('exit', (err) => {
});


io.on('connection', (socket) => {
  console.log('a user connected');

  const jdb = spawn('jdb', ['MyProg01'], { cwd });
  let msgbuff = '';

  jdb.stdout.on('data', (data) => {
    console.log("data : " + data.toString());
    msgbuff += data.toString();

    const array = msgbuff.split('\n');
    // if (/\n$/.test(msgbuff)) {
    //   io.emit('chat message', msgbuff);
    //   msgbuff = '';
    // }
    msgbuff = array.pop();
    if (/[>:\]] $/.test(msgbuff)) {
      array.push(msgbuff);
      msgbuff = '';
    }

    array.forEach(msg => {
      io.to(socket.id).emit('chat message', msg);
      console.log('emit : ' + msg);
    });
    console.log('msgbuff : ' + msgbuff);
  });


  socket.on('chat message', (msg) => {
    jdb.stdin.write(msg + '\n');

    // console.log('message: ' + msg);
    // io.emit('chat message', '> ' + msg);
    io.to(socket.id).emit('chat message', '> ' + msg);
  });

  socket.on('disconnect', (msg) => {
    console.log([socket.id, msg].join(' '));
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});