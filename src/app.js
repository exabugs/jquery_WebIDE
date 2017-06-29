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
const async = require('async');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

const jdbModule = require('./jdb');

const ROOT = `${__dirname}/../data`;

const jdbs = {};

const currentJdb = {};

// 非同期の再帰でフォルダを探査して終了するとコールバック
const walk = (root, dir, data, callback, _stack) => {

  _stack = _stack || [];
  _stack.push(true);

  fs.readdir(path.join(root, dir), function(err, files) {
    if (err) {
      return callback(err);
    }

    files.forEach(function(text) {
      const id = path.join(dir, text);
      const fp = path.join(root, id); // to full-path
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        const self = { id, text, children: [] };
        data.push(self);
        walk(root, id, self.children, callback, _stack); // ディレクトリなら再帰
      } else {
        const self = { id, text, type: "file" };
        data.push(self);
      }
    });
    _stack.pop();
    if (!_stack.length)
      return callback(null);
  });
};

const getDir = (socket) => {
  const core = [];
  async.waterfall([
    next => {
      const root = { id: 'src', data: "0", text: 'java', children: [] };
      core.push(root);
      walk(ROOT, root.id, root.children, next);
    },
    next => {
      const root = { id: 'lib', data: "1", text: 'jar', children: [] };
      core.push(root);
      walk(ROOT, root.id, root.children, next);
    },
    next => {
      const root = { id: 'bin', data: "2", text: 'class', children: [] };
      core.push(root);
      walk(ROOT, root.id, root.children, next);
    },
  ], err => {
    if (err) {
      console.log(err);
    } else {
      socket.emit('get dir', { data: { core } });
    }
  });
};

const getDirBak = (socket) => {
  const root = { id: '', text: '/', children: [] };
  walk(ROOT, root.id, root.children, err => {
    if (err) {
      console.log(err);
    } else {
      socket.emit('get dir', { data: { core: [root] } });
    }
  });
};

io.on('connection', (socket) => {
  console.log('a user connected');

  jdbs[socket.id] = {};

  // デバッガの標準出力
  const emit = (pid, msg) => {
    if (currentJdb[socket.id] && currentJdb[socket.id].pid === pid) {
      io.to(socket.id).emit('chat message', JSON.stringify(msg));
      console.log('emit : ' + msg);
    } else {
      console.log('invalidated emit : ' + msg);
    }
  };

  // デバッガの終了イベント
  const onExit = (pid) => {
    emit(pid, 'exit debugger : ' + pid);
    getDir(socket);
    delete jdbs[socket.id][pid];
  };

  const exit = () => {
    _.each(jdbs[socket.id], jdb => {
      emit(jdb.pid, 'Kill debugger : ' + jdb.pid);
      jdb.command && jdb.command('exit');
    });
  };

  socket.on('chat message', (msg) => {

    if (msg === 'run') {
      exit();
      const jdb = jdbModule.run(ROOT, emit, onExit);
      jdbs[socket.id][jdb.pid] = jdb;

      currentJdb[socket.id] = jdb;
      emit(jdb.pid, 'Start debugger : ' + jdb.pid);
    } else if (currentJdb[socket.id] && msg) {
      // デバッガへのコマンド入力
      currentJdb[socket.id].command(msg);
    }

    // emit('> ' + msg);
  });

  socket.on('compile file', (name) => {
    const jdb = jdbModule.compile(ROOT, emit, onExit);
    jdbs[socket.id][jdb.pid] = jdb;

    currentJdb[socket.id] = jdb;
    emit(jdb.pid, 'Start compile : ' + jdb.pid);
  });

  socket.on('get file', (name) => {
    fs.readFile(path.join(ROOT, name), (err, data) => {
      if (err) {

      } else {
        socket.emit('get file', { name: name, data: data.toString() });
      }
    });
  });

  socket.on('get dir', () => getDir(socket));

  socket.on('disconnect', (msg) => {
    exit();
    console.log([socket.id, msg].join(' '));
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

// sample
//     const json = [
//       {
//         "text": "Root node",
// //                    state: {
// //                      opened: true,
// ////                      disabled  : boolean  // is the node disabled
// ////                      selected  : boolean  // is the node selected
// //                    },
//         "children": [
//           { "text": "MyProg01.java", "type": "file" },
//           { "text": "Child node 1" },
//           {
//             "text": "Child node 2",
//             "children": [
//               { "text": "Child node 21", "type": "file" }
//             ]
//           }
//         ]
//       },
//     ];

