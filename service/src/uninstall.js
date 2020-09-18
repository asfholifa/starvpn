const Service = require('node-windows').Service;
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const appDataPath = process.argv[2];

if (appDataPath) {
  const emailFile = path.join(appDataPath, 'starvpn', 'email.json');
  try {
    const { email, auth_token } = JSON.parse(fs.readFileSync(emailFile, { encoding: 'utf8' }));
    if (email && auth_token) {
      axios
        .post(`https://${config.API_HOST}/api/response.php`, {
          command: 'terminate_user',
          email,
          auth_token,
          custom: 1,
        })
        .then((res) => {
          console.log(`User ${email} terminated`);
          console.log(res.data);
        })
        .catch((error) => {
          console.log(`Cant terminate_user ${email}`);
          console.error(error);
        });
    }
  } catch (e) {
    console.log(`No user to terminate`);
  }
}

const svc = new Service({
  name: config.SERVICE_NAME,
  script: path.join(__dirname, 'wsProxyClient.js'),
});

svc.on('uninstall', function() {
  console.log('Uninstall complete.');
});

svc.uninstall();
