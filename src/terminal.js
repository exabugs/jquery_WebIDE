//
// ターミナル
// https://github.com/pnitsch/jsTerm
//
// エディタは CodeMirror
// https://codemirror.net/demo/marker.html
//
//
// レイアウト
// http://layout.jquery-dev.com/demos.cfm
// http://stackoverflow.com/questions/21784574/a-full-page-layout-with-resizable-panes-using-jquery-ui
// https://github.com/allpro/layout/

const express = require('express');
const _ = require('underscore');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const spawn = require('child_process').spawn;

const PORT = process.env.PORT || 4000;
const WORK = __dirname + '/../';

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');

  const option = [];

  const terminal = spawn('bash', option, {});

  terminal.on('close', (a) => {
    console.log(a);
  });

  terminal.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  terminal.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  socket.on('chat message', (msg) => {
    console.log(msg);
    terminal.stdin.write(msg + '\n');
  });

  socket.on('disconnect', (msg) => {
    console.log([socket.id, msg].join(' '));
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

