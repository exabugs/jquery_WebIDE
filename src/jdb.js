const path = require('path');
const spawn = require('child_process').spawn;
const _ = require('underscore');

const env = { _JAVA_OPTIONS: '-Duser.language=en -Duser.country=JP' };

// step 出力 で キーとなるラベルによるコマンドの判定
const labelExp = [
  { command: 'where', label: '"thread=.+", .+, line=\\\d+ bci=\\\d+' },
  { command: 'locals', label: 'Method arguments:' },
  { command: 'locals', label: 'No local variables' },
  { command: 'threads', label: 'Group system:' },
].map(info => {
  info.regexp = new RegExp(`(.* )?(${info.label})$`);
  return info;
});

const compile = (_cwd, emit, exit) => {
//  const cwd = __dirname + '/../data';
  const option = [];
  option.push('-g');
  option.push('-verbose');

  // option.push('-s');
  // option.push(path.join(cwd, 'src'));
  const cwd = path.join(_cwd, 'src')

  option.push('-d');
  option.push(path.join(_cwd, 'bin'));

  option.push('MyProg01.java');

  const javac = spawn('javac', option, { cwd, env });

  javac.stdout.on('data', (data) => {
    emit(javac.pid, data.toString());
  });

  javac.on('exit', () => exit(javac.pid));

  return {
    pid: javac.pid,
  };
};

const run = (_cwd, emit, exit) => {

  const cmdlist = [];

  const doing = {
    command: null,
    output: [],
  };

  cwd = path.join(_cwd, 'bin');

  const jdb = spawn('jdb', ['MyProg01'], { cwd, env });
  let msgbuff = '';

  const command = cmd => {
    const _cmd = cmd.split(' ');
    // 'list', 'where', 'locals',
    const white = ['run', 'threads', 'thread', 'step', 'cont', 'monitor', 'exit'];
    if (_.contains(white, _cmd[0])) {
      cmdlist.push(cmd);
      checkNextCommand();
    } else if (cmd) {
      emit(jdb.pid, 'Bad command : ' + cmd);
    }
  };

  const checkNextCommand = () => {
    if (cmdlist.length) {
      doing.command = cmdlist.shift();
      jdb.stdin.write(doing.command + '\n');
    }
  };

  jdb.on('exit', () => exit(jdb.pid));

  // run
  command('run');
  command('monitor where');
  command('monitor locals');
  command('monitor threads');
  command('thread 1');

  jdb.stdout.on('data', (data) => {
    console.log("data : " + data.toString());

    msgbuff += data.toString();

    const array = msgbuff.split('\n');

    msgbuff = array.pop();

    Array.prototype.push.apply(doing.output, array);

    // コマンドに対する出力の終了
    if (/[>:\]] $/.test(msgbuff)) {

      msgbuff = '';

      let { command, output } = doing;

      const outputMap = {};

      // step 出力 で キーとなるラベルによるコマンドの判定
      output.forEach(msg => {
        labelExp.forEach(info => {
          if (info.regexp.test(msg)) {
            msg = RegExp.$2;
            command = info.command;
          }
        });
        outputMap[command] = outputMap[command] || { command, output: [] };
        outputMap[command].output.push(msg);
      });

      _.each(outputMap, doing => {

        switch (doing.command) {
          case 'where':
            doing.data = doing.output.reduce((memo, msg) => {
              if (/^  \[\d+\] (.+) \((.+):(\d+)\)$/.test(msg)) {
                memo.push({
                  func: RegExp.$1,
                  file: RegExp.$2,
                  line: Number(RegExp.$3),
                });
              }
              return memo;
            }, []);
            break;
          case 'threads':
            let type = '';
            doing.data = doing.output.reduce((memo, msg) => {
              if (/^  \((.+)\)(0x[0-9a-f]+) (.+) ((running|waiting))$/.test(msg)) {
                const { $1, $2, $3, $4 } = RegExp;
                memo[type].push({
                  name: $1,
                  id: Number.parseInt($2),
                  type: $3.replace(/ +/g, ' ').trim(),
                  status: $4,
                });
              }
              if (/^Group (.+):/.test(msg)) {
                type = RegExp.$1;
                memo[type] = [];
              }
              return memo;
            }, {});
            break;
        }

        emit(jdb.pid, doing);
      });

      doing.output = [];

      // 次のコマンドを実行
      checkNextCommand();
    }

  });

  return {
    command,
    pid: jdb.pid,
  };
};

module.exports = { run, compile };
