//
//
// エディタは CodeMirror
// https://codemirror.net/demo/marker.html
//
// Codemirror Component for React.js
// https://github.com/JedWatson/react-codemirror
// ReactでCodemirrorを使う
// https://memo.mmmpa.net/memo/6

const async = require('async');

const cwd = '/Users/dreamarts/WebstormProjects/JavaSchool/data';
// const env = { LANG: 'C' };


const spawn = require('child_process').spawn;

const javac = spawn('javac', ['MyProg01.java', '-g'], { cwd });
javac.on('exit', (err) => {
});



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



