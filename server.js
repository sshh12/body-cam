const express = require('express');
const path = require('path');
let spawn = require('child_process').spawn;

// ffmpeg -i test.flv -c:v libx264 -crf 19 -strict experimental test.mp4

const port = process.env.PORT || process.env.WEB_PORT || 5000;
const host = process.env.WEB_HOST || '0.0.0.0';

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use('/', express.static(path.join(__dirname, 'build')));

io.on('connection', (sock) => {
  console.log('connected!');
  let sockState = {
    video: false,
    ffmpeg: null
  };
  sock.emit('hb:client');
  sock.on('start', (data) => {
    sockState.video = true;
    let ops = [
			'-i','-',
			'-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',
			'-c:a', 'aac', '-ar', '44100', '-b:a', '64k',
			'-y',
			'-use_wallclock_as_timestamps', '1',
			'-async', '1', 
			'-bufsize', '1000',
			'-f', 'flv', 'test.flv'
    ];
    console.log('STARTING');
    sockState.ffmpeg = spawn('ffmpeg', ops);
    sockState.ffmpeg.on('error', (err) => {
      console.error(err);
    });
  });
  sock.on('stream', (data) => {
    if (sockState.video) {
      sockState.ffmpeg.stdin.write(data);
    }
  });
  let endStream = () => {
    console.log('STOPPING');
    if (sockState.video) {
      sockState.video = false;
      sockState.ffmpeg.kill('SIGINT');
    }
    let cvt = spawn('ffmpeg', ['-i', 'test.flv', '-c:v', 'libx264', '-crf', '19', '-strict', 'experimental', '-y', 'test.mp4']);
    cvt.on('error', (err) => {
      console.error(err);
    });
    cvt.on('end', (err) => {
      console.log('CVT DONE');
    });
  }
  sock.on('stop', () => {
    endStream();
  });
  sock.on('disconnect', () => {
    endStream();
  });
});

server.listen(port, host, () => console.log(`Listening on port ${port}`));