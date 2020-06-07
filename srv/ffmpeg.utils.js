let spawn = require('child_process').spawn;

module.exports.covertToMp4 = (fn, outputFn) => {
  return new Promise((resolve, reject) => {
    let proc = spawn('ffmpeg', ['-i', fn, outputFn]);
    proc.on('error', (err) => {
      reject(err);
    });
    proc.on('exit', () => {
      resolve(outputFn);
    })
  })
};