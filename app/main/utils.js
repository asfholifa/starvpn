import dns from 'dns';
import path from 'path';

import extIp from 'ext-ip';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import noop from 'lodash/noop';
import sortBy from 'lodash/sortBy';
import zip from 'lodash/zip';
import ping from 'net-ping';
import wifiName from 'wifi-name';
const dnsPromises = dns.promises;

const extIpService = extIp();

const lookupOptions = {
  family: 4,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

const pingOptions = {
  networkProtocol: ping.NetworkProtocol.IPv4,
  packetSize: 16,
  retries: 2,
  sessionId: process.pid % 65535,
  timeout: 1000,
  ttl: 128,
};

export async function getClosestHosts(hosts, numHosts = 1) {
  if (isEmpty(hosts) || !isArray(hosts)) {
    console.log(`Invalid hosts ${hosts} provided to getClosestHosts`);
    return [];
  }
  const addresses = await Promise.all(
    hosts.map((host) => dnsPromises.lookup(host, lookupOptions).catch(noop)),
  );
  const session = ping.createSession(pingOptions);
  const roundTripTimes = await Promise.all(
    map(
      addresses,
      (address) =>
        new Promise((resolve) => {
          if (address === null) {
            return resolve(Infinity);
          }
          session.pingHost(address.address, (err, target, sent, rcvd) => {
            if (err) {
              resolve(Infinity);
            } else {
              const ms = rcvd - sent;
              resolve(ms);
            }
          });
        }),
    ),
  );
  session.close();
  const hostsSortedByPing = sortBy(
    map(zip(hosts, roundTripTimes), ([host, rtt]) => ({ host, rtt })),
    'rtt',
  );
  console.info('by ping', hostsSortedByPing);
  return map(hostsSortedByPing.slice(0, numHosts), 'host');
}

export async function getConnectionName() {
  let name;
  try {
    name = await wifiName();
  } catch (e) {
    name = 'Local Area Connection';
  }
  return name;
}
export function getPublicIp() {
  return extIpService.get();
}
export function getConnectionLogPath() {
  return path.join(process.cwd(), 'connection-debug.log');
}
