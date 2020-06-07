const express = require('express');
const path = require('path');
let spawn = require('child_process').spawn;
const Email = require('email-templates');
const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const port = process.env.PORT || process.env.WEB_PORT || 5000;
const host = process.env.WEB_HOST || '0.0.0.0';

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SG_KEY
  })
);

app.use('/', express.static(path.join(__dirname, 'build')));

let sendVideo = async (emailAddr, videoFn) => {
  const email = new Email({
    message: {
      from: 'noreply@sshh.io',
      attachments: [
        {
          filename: 'recording.mp4',
          path: videoFn
        }
      ]
    },
    preview: false,
    send: true,
    transport: transport
  });
  await email
    .send({
      template: 'video',
      message: {
        to: emailAddr
      },
      locals: {}
    });
};

io.on('connection', (sock) => {
  const id = uuidv4();
  console.log('[' + id + ']');
  let sockState = {
    video: false,
    ffmpeg: null
  };
  sock.emit('start', JSON.stringify({ id: id }));
  sock.on('start', (data) => {
    Object.assign(sockState, JSON.parse(data));
    sockState.video = true;
    console.log('[recording]');
    sockState.vidStream = fs.createWriteStream('vidtmp/' + id + '.webm');
  });
  sock.on('stream', (data) => {
    if (sockState.video) {
      sockState.vidStream.write(data);
    }
  });
  let endStream = () => {
    console.log('[stopped]');
    if (sockState.video) {
      sockState.video = false;
      sockState.vidStream.close();
      let cvt = spawn('ffmpeg', ['-i', 'vidtmp/' + id + '.webm', 'vidtmp/' + id + '.mp4']);
      cvt.on('error', (err) => {
        console.error(err);
      });
      cvt.on('exit', (err) => {
        let { email } = sockState;
        console.log('[processed]', email);
        fs.unlinkSync('vidtmp/' + id + '.webm');
        // sendVideo(email, 'vidtmp/' + id + '.mp4');
      });
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