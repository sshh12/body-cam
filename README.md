
# body-cam
> Backup videos as they are being recorded.

![demo](https://user-images.githubusercontent.com/6625384/102697634-ee451180-41fc-11eb-86af-af8fb76a1c4f.gif)

If the phone was critically damaged while recording, what was recorded up to that point will be automatically emailed to the user.

## Hosting
### Generic
1. Install [ffmpeg](https://www.ffmpeg.org/download.html)
2. Create a [SendGrid](https://sendgrid.com/) account to process emails (free while under limit, make sure to setup [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)).
3. Set the environment variable `SG_KEY` to a valid [SendGrid](https://sendgrid.com/) API key and `FROM_EMAIL` to the email to send recordings from.
4. `$ git clone https://github.com/sshh12/body-cam.git && cd body-cam`
5. `$ yarn install`
6. `$ node server.js`

## Heroku
1. Fork `https://github.com/sshh12/body-cam`
2. Create a project on Heroku and deploy from the fork
3. Add the `SG_KEY` and `FROM_EMAIL` to `Config Vars` (see more above)
4. Attach build-packs: `heroku/nodejs` and `https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git`
