const domoticzAPI = require('./domoticzApi');

const commandMap = {
    'TurnOn': domoticzAPI.turnOn,
    'TurnOff': '',
    'SetBrightness': '',
    'AdjustUpBrightness': '',
    'AdjustDownBrightness': '',
    'SetWindSpeed': '',
    'AdjustUpWindSpeed': '',
    'AdjustDownWindSpeed': ''
};

const deviceDefault = {
    "deviceId": "34ea34cf2e63",
    "deviceName": "light1",
    "deviceType": "light",
    "zone": "",
    "brand": "",
    "model": "",
    "icon": "https://git.cn-hangzhou.oss-cdn.aliyun-inc.com/uploads/aicloud/aicloud-proxy-service/41baa00903a71c97e3533cf4e19a88bb/image.png",
    "properties": [{
        "name": "powerstate",
        "value": "off"
    }],
    "actions": [
        "TurnOn",
        "TurnOff",
        "SetBrightness",
        "AdjustBrightness",
        "SetTemperature",
        "Query"
    ],
    "extensions": {
        "extension1": "",
        "extension2": ""
    }

};

function AligenieGateway() {

}

AligenieGateway.prototype.handle = async function (ctx) {
    let req = ctx.request;
    let namespace = req.body.header.namespace;

    if (namespace === 'AliGenie.Iot.Device.Control') {
        await this.handleControl(ctx);
    } else if (namespace === 'AliGenie.Iot.Device.Discovery') {
        await this.handleDiscovery(ctx);
    } else if (namespace === 'AliGenie.Iot.Device.Query ') {
        await this.handleQuery(ctx);
    }
};

AligenieGateway.prototype.handleQuery = async function (ctx) {

};

AligenieGateway.prototype.handleDiscovery = async function (ctx) {
    let deviceList = await domoticzAPI.listDevice();
    let responseHeader = Object.assign({}, req.body.header, {name: req.body.header.name + 'Response'});

    let deviceToAli = deviceList.result.map(d => {
        return Object.assign({}, deviceDefault, {deviceId: d.idx, deviceName: d.Name})
    });
    ctx.body = {
        "header": responseHeader,
        "payload": {
            "deviceId": deviceId
        }
    };
};

AligenieGateway.prototype.handleControl = async function (ctx) {
    let req = ctx.request;
    let command = req.body.header.name;
    let deviceId = req.body.payload.deviceId;
    if (commandMap[command] instanceof Function) {
        await commandMap[commandMap].call(domoticzAPI, deviceId)
    }
    let responseHeader = Object.assign({}, req.body.header, {name: req.body.header.name + 'Response'});
    ctx.body = {
        "header": responseHeader,
        "payload": {
            "deviceId": deviceId
        }
    };
};


module.exports = new AligenieGateway();