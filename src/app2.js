//
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

  // $ docker run -d -it centos /bin/bash
  const option = ['run', '-dit'];

  option.push('-v');
  option.push(`${WORK}:/app:ro`);

  option.push('-p');
  option.push(`0:${PORT}`);

  option.push('bitnami/node');
  option.push('node');
  option.push(`/app/src/app.js`);


  const docker = spawn('docker', option, {});

  docker.on('close', (a) => {
    console.log(a);
  });

  socket.on('chat message', (msg) => {
    console.log(msg);
    docker.stdin.write(msg + '\n');
  });

  socket.on('disconnect', (msg) => {
    console.log([socket.id, msg].join(' '));
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

