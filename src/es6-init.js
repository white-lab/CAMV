const path = require('path')

require('electron-compile').init(
  path.join(__dirname, '..'),
  require.resolve('./main')
);
