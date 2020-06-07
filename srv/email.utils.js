const Email = require('email-templates');
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport(
  require('nodemailer-sendgrid')({apiKey: process.env.SG_KEY})
);

module.exports.sendVideo = async (emailAddr, videoFn) => {
  const email = new Email({
    message: {
      from: 'noreply@sshh.io',
      attachments: [
        {
          filename: 'video.mp4',
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