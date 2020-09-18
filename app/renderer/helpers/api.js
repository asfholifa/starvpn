import { IP_TYPES } from './constants';

const rax = require('retry-axios');
const Axios = require('axios');
const config = require('../../main/config');

const baseURL = `https://www.${config.API_HOST}/api/response.php`;

const REVERSE_IP_TYPES_MAPPING = {
  wireless: IP_TYPES.MOBILE_WIRELESS_IP,
  rotating: IP_TYPES.ROTATING_RESIDENTAL_IP,
  datacenter: IP_TYPES.STATIC_DATACENTER_IP,
  static: IP_TYPES.STATIC_RESIDENTAL_IP,
};

const dnsFlexApi = Axios.create({
  baseURL,
  // API no longer correctly handles content-type header
  // headers: { 'content-type': 'application/json' }
});

const dnsFlexRetryApi = Axios.create({
  baseURL,
  // headers: { 'content-type': 'application/json' },
});

const logRequest = (request) => {
  console.log(`Request ${request.data.command}`);
  console.log(request);
  return request;
};
const logResponse = (response) => {
  let command;
  try {
    command = JSON.parse(response.config.data).command;
  } catch {
    command = 'n/a';
  }
  console.log(`Response ${command}`);
  console.log(response);
  return response;
};

dnsFlexApi.interceptors.request.use(logRequest);
dnsFlexApi.interceptors.response.use(logResponse);
dnsFlexRetryApi.interceptors.request.use(logRequest);
dnsFlexRetryApi.interceptors.response.use(logResponse);

dnsFlexRetryApi.defaults.raxConfig = {
  instance: dnsFlexRetryApi,
  retry: 3,
  noResponseRetries: 5,
  retryDelay: 300,
  httpMethodsToRetry: ['GET', 'POST'],
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
  },
};

rax.attach(dnsFlexRetryApi);

const URL = 'http://localhost:5000';
const API_AUTH = {
  api_username: 'dGEQR1i9ZEmv4bn',
  api_password: 'STbaqWDq7JCs8Hp',
};

const Api = {
  connect: (data) => Axios.post(`${URL}/connect`, { data }),
  disconnect: () => Axios.get(`${URL}/disconnect`),
  login: ({ email, password }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        ...API_AUTH,
        command: 'vpn_signin_client',
        email,
        password,
        custom: 1,
      },
    }),
  signup: ({
    firstname,
    lastname,
    email,
    address1,
    city,
    state,
    postcode,
    country,
    phonenumber,
    password2,
  }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        ...API_AUTH,
        command: 'AddClient',
        firstname,
        lastname,
        email,
        address1,
        city,
        state,
        postcode,
        country,
        phonenumber,
        password2,
        noemail: 1,
      },
    }),
  setupFreeVPN: ({ email, auth_token }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        auth_token,
        command: 'setup_free_product',
        email,
        custom: 1,
      },
    }),
  getUserData: ({ email, auth_token }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        auth_token,
        command: 'refresh_data',
        email,
        custom: 1,
      },
    }),
  getIPConfigurations: () =>
    dnsFlexApi({
      method: 'post',
      data: {
        ...API_AUTH,
        command: 'get_ip_configuration_options',
        custom: 1,
      },
    }),
  updateIPConfigurations: ({
    email,
    ip_type,
    country,
    region,
    port,
    isp,
    ipid,
    timeinterval,
    auth_token,
  }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        auth_token,
        command: 'update_ip_configuration',
        email,
        ip_type,
        country,
        region,
        port,
        isp,
        timeinterval,
        custom: 1,
      },
    }),
  updateIP: ({ email, ip_type, port, auth_token }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        auth_token,
        command: 'ip_update_now',
        email,
        ip_type: REVERSE_IP_TYPES_MAPPING[ip_type],
        port,
        custom: 1,
      },
    }),
  getDNSServers: () =>
    dnsFlexRetryApi({
      method: 'post',
      data: {
        ...API_AUTH,
        command: 'get_dns_servers',
        custom: 1,
      },
    }),
  getVpnServersHostnames: () =>
    dnsFlexRetryApi({
      method: 'post',
      data: {
        ...API_AUTH,
        command: 'get_vpn_hostnames',
        custom: 1,
      },
    }),
  getSmartVpnDnsServers: () =>
    dnsFlexRetryApi({
      method: 'post',
      data: {
        ...API_AUTH,
        command: 'get_smartdns',
        custom: 1,
      },
    }),
  reactivateFreeVpn: ({ email, auth_token }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        email,
        auth_token,
        command: 'reactivate_free_vpn',
        custom: 1,
      },
    }),
  getCurrentVpnUsage: ({ email, auth_token }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        email,
        auth_token,
        command: 'get_current_vpnusage',
        custom: 1,
      },
    }),
  socialLogin: ({ accesstoken, platform }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        ...API_AUTH,
        accesstoken,
        platform,
        command: 'social_signin_client',
        custom: 1,
      },
    }),
  getCoordinates: ({ country, region }) =>
    dnsFlexApi({
      method: 'post',
      data: {
        ...API_AUTH,
        countrycode: country,
        region,
        command: 'get_coordinates',
        custom: 1,
      },
    }),
};

export default Api;
