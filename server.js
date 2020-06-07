const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const email = require('./srv/email.utils');
const ffmpeg = require('./srv/ffmpeg.utils');

const port = process.env.PORT || process.env.WEB_PORT || 5000;
const host = process.env.WEB_HOST || '0.0.0.0';

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


app.use('/', express.static(path.join(__dirname, 'build')));

io.on('connection', (sock) => {
  const id = uuidv4();
  let state = {
    stream: false,
    ioStream: null,
    outFn: path.join(os.tmpdir(), id + '.webm')
  };
  sock.emit('start', JSON.stringify({ id: id }));
  sock.on('start', (cfg) => {
    if(state.stream) return;
    console.log(cfg);
    Object.assign(state, JSON.parse(cfg));
    state.stream = true;
    state.ioStream = fs.createWriteStream(state.outFn);
  });
  sock.on('stream', (data) => {
    if (state.stream) {
      state.ioStream.write(data);
    }
  });
  let endStream = async () => {
    if (state.stream) {
      state.stream = false;
      state.ioStream.close();
      if(state.sendEmail) {
        let mp4Name = state.outFn.replace('.webm', '.mp4');
        await ffmpeg.covertToMp4(state.outFn, mp4Name);
        await email.sendVideo(state.email, mp4Name);
        fs.unlinkSync(mp4Name);
      }
      fs.unlinkSync(state.outFn);
    }
  }
  sock.on('stop', () => {
    endStream();
  });
  sock.on('disconnect', () => {
    endStream();
  });
});

server.listen(port, host, () => console.log(`Listening on port ${port}`));