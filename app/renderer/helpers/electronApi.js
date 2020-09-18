import Axios from 'axios';

const URL = 'http://localhost:5000';
const handleResponse = (res) => {
    const { data, config: { method, url } } = res;
    console.log(`Handle RES ${method.toUpperCase()}:${url}`)
    if (data && data.error) {
        throw data.error
    }

    return res
}

const electronApi = {
    connect: (protocol, vpnServers, dnsServers) => Axios.post(`${URL}/vpn/connect`, { protocol, vpnServers, dnsServers }).then(handleResponse),
    disconnect: () => Axios.get(`${URL}/vpn/disconnect`).then(handleResponse),
    socketConnect: () => Axios.get(`${URL}/ws/connect`).then(handleResponse),
    socketDisconnect: () => Axios.get(`${URL}/ws/disconnect`).then(handleResponse),
    updateVpnUsernameAndPass: ({ username, password }) => Axios.put(`${URL}/vpn/credentials`, { username, password }).then(handleResponse),
    saveUserEmail: ({ email, auth_token }) => Axios.post(`${URL}/user`, { email, auth_token }).then(handleResponse),
};

export default electronApi;
