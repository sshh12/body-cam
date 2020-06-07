const Email = require('email-templates');
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport(
  require('nodemailer-sendgrid')({apiKey: process.env.SG_KEY})
);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sshh.io';

module.exports.sendVideo = async (emailAddr, videoFn, locals = {}) => {
  const email = new Email({
    message: {
      from: FROM_EMAIL,
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
      locals: locals
    });
};