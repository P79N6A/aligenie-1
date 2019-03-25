const request = require('request-promise-native');

class DomoticzAPI {

    constructor() {
        this.host = "http://192.168.1.174:8080"
    }

    async listDevice() {
        return await request(this.host + '/json.htm?type=devices&filter=light&used=true&order=Name');
    }

    async turnOn(id) {
        return await request(this.host + `/json.htm?type=command&param=switchlight&idx=${id}&switchcmd=On`);
    }

    async turnOff(id) {
        return await request(this.host + `/json.htm?type=command&param=switchlight&idx=${id}&switchcmd=Off`);
    }

    async setDimmer(id, level) {
        return await request(this.host + `/json.htm?type=command&param=switchlight&idx=${id}&switchcmd=Set%20Level&level=${level}`);
    }
}


module.exports = new DomoticzAPI();