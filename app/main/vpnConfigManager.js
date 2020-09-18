const path = require('path');
const fs = require('fs');
const isDevelopment = process.env.NODE_ENV === 'development';
const Axios = require('axios');
const config = require('./config');

const VPN_CONFIG_FOLDER_PATH = isDevelopment
  ? path.join(__dirname, '..', '..', '/vpn/config/')
  : path.join(__dirname, '..', '..', '..', '/vpn/config/');

const CONFIG_TYPES = {
  UDP: 'udp',
  TCP: 'tcp',
};

const VPN_CONFIGS_FILENAMES = {
  [CONFIG_TYPES.UDP]: `vpn.udp.${config.API_HOST}.ovpn`,
  [CONFIG_TYPES.TCP]: `vpn.tcp.${config.API_HOST}.ovpn`,
};

const UDP_CONFIG_URL = `https://www.${config.API_HOST}/dashboard/modules/addons/dashboard/vpn-app-config-files/vpn-app.udp.${config.API_HOST}.ovpn`;
const TCP_CONFIG_URL = `https://www.${config.API_HOST}/dashboard/modules/addons/dashboard/vpn-app-config-files/vpn-app.tcp.${config.API_HOST}.ovpn`;

const CREDENTIALS_FILENAME = 'pass.txt';

const getConfigUrl = (proto) => (proto === 'udp' ? UDP_CONFIG_URL : TCP_CONFIG_URL);

const Util = {
  getConfigFileAsString: function(type = '') {
    const FULL_PATH = path.join(VPN_CONFIG_FOLDER_PATH, VPN_CONFIGS_FILENAMES[type]);

    return new Promise((resolve, reject) => {
      let fileData = '';
      const rs = fs.createReadStream(FULL_PATH, 'utf8');
      rs.on('data', (data) => {
        fileData += data;
      });
      rs.on('end', () => {
        console.log(`Config file ${type}, retrieved`);
        resolve(fileData);
      });
      rs.on('error', reject);
    });
  },
  getCredentialsFileAsString: function() {
    const FULL_PATH = path.join(VPN_CONFIG_FOLDER_PATH, CREDENTIALS_FILENAME);
    return new Promise((resolve, reject) => {
      let fileData = '';
      const rs = fs.createReadStream(FULL_PATH, 'utf8');
      rs.on('data', (data) => {
        fileData += data;
      });
      rs.on('end', () => {
        console.log(`Credentials file retrieved`);
        resolve(fileData);
      });
      rs.on('error', reject);
    });
  },
  /** @param config String to update
   * @param callback function handler, return updated line
   * return config string file
   */
  updateConfigLines: function(config = '', callback = (l) => l) {
    const lines = config.split('\n');
    const length = lines.length;

    return lines.reduce((acc, line, ind) => {
      line = callback(line, ind);
      const isLastLine = length - ind <= 1;
      const separator = isLastLine ? '' : '\n';
      acc += line + separator;
      return acc;
    }, '');
  },
  saveConfig: function(config, type) {
    const fileName = VPN_CONFIGS_FILENAMES[type];
    return fs.writeFileSync(path.join(VPN_CONFIG_FOLDER_PATH, fileName), config);
  },
};

function replaceRemoteServerNameFor(config = '', remoteDNS = '') {
  return Util.updateConfigLines(config, (line) => {
    if (line.indexOf('remote ') !== -1) {
      const words = line.split(' ');
      words[1] = remoteDNS;
      line = words.join(' ');

      console.log('Remote server replaced');
    }
    return line;
  });
}

function enableDhcpOptionsFor(config, options = []) {
  let dhcpOptionIndex = 0;

  return Util.updateConfigLines(config, (line) => {
    if (line.indexOf('dhcp-option ') !== -1) {
      const isOptionEnabled = !!options[dhcpOptionIndex];
      const words = line.split(' ');
      words[0] = isOptionEnabled ? 'dhcp-option' : '#dhcp-option';
      if (isOptionEnabled) {
        words[2] = options[dhcpOptionIndex];
      }
      line = words.slice(0, 3).join(' ');
      ++dhcpOptionIndex;
    }
    return line;
  });
}

function disableDhcpOptionsFor(config) {
  return Util.updateConfigLines(config, (line) => {
    if (line.indexOf('dhcp-option ') !== -1) {
      const words = line.split(' ');
      words[0] = '#dhcp-option';
      line = words.join(' ');
    }
    return line;
  });
}

function disableConfigsDhcpOptions() {
  return Promise.all(
    Object.values(CONFIG_TYPES).map((type) => {
      return Util.getConfigFileAsString(type)
        .then((config) => {
          console.log(`Config to disable dhcp options found`);
          const updatedConfig = disableDhcpOptionsFor(config);
          return Util.saveConfig(updatedConfig, type);
        })
        .then(() => {
          console.log(`Config ${type} successfully updated`);
          return;
        })
        .catch((err) => {
          console.log(`Error updating config`);
          console.error(err);
        });
    }),
  );
}

function updateAndTurnOnDhcpOptionsValues(dhcpOptions = []) {
  return Promise.all(
    Object.values(CONFIG_TYPES).map((type) => {
      return Util.getConfigFileAsString(type)
        .then((config) => {
          const updatedConfig = enableDhcpOptionsFor(config, dhcpOptions);
          return Util.saveConfig(updatedConfig, type);
        })
        .then(() => {
          console.log(`Config ${type} successfully updated`);
        })
        .catch((err) => {
          console.log(`Error updating config`);
          console.error(err);
        });
    }),
  );
}

function updateRemoteServerDns(dns) {
  return Promise.all(
    Object.values(CONFIG_TYPES).map((type) => {
      return Util.getConfigFileAsString(type)
        .then((config) => {
          const updatedConfig = replaceRemoteServerNameFor(config, dns);
          return Util.saveConfig(updatedConfig, type);
        })
        .then(() => {
          console.log(`Config ${type} successfully updated`);
        })
        .catch((err) => {
          console.log(`Error updating config`);
          console.error(err);
        });
    }),
  );
}

const updateUsernameAndPass = async (target, { username = '', password = '' }) =>
  fs.promises.writeFile(target, [username, password].join('\n'));

const updateOpenVpnConfig = async (configBody, target, options = {}) => {
  const defaultOptions = {
    remoteHost: '',
    dns1: '',
    dns2: '',
  };
  const finalOptions = Object.assign({}, defaultOptions, options);
  const replacements = Object.keys(finalOptions).map((optName) => ({
    from: `{${optName}}`,
    to: finalOptions[optName],
  }));

  let result = configBody;
  replacements.forEach((item) => {
    result = result.replace(item.from, item.to);
  });
  return fs.promises.writeFile(target, result);
};

const fetchConfig = async (proto) => {
  const configUrl = getConfigUrl(proto);
  console.log(`Loading ${proto} config template from ${configUrl}`);
  return Axios.get(configUrl).then((response) => response.data);
};

module.exports = {
  updateRemoteServerDns,
  updateOpenVpnConfig,
  updateAndEnableDhcpOptions: updateAndTurnOnDhcpOptionsValues,
  disableDhcpOptions: disableConfigsDhcpOptions,
  updateUsernameAndPass,
  fetchConfig,
};
