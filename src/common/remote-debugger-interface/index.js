const Chrome = require('./lib/chrome');
const EventEmitter = require('events');
module.exports = function CDP(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  const notifier = new EventEmitter();
  if (typeof callback === 'function') {
    // allow to register the error callback later
    process.nextTick(() => {
      new Chrome(options, notifier);
    });
    return notifier.once('connect', callback);
  } else {
    return new Promise((fulfill, reject) => {
      notifier.once('connect', fulfill);
      notifier.once('error', reject);
      new Chrome(options, notifier);
    });
  }
}
