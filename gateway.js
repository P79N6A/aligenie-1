var request = require('request-promise');

function Gateway() {

}

Gateway.prototype.handle = async function(ctx) {
	let req = ctx.request;

	if (req.body.header.namespace == 'AliGenie.Iot.Device.Control') {
		await handleControl(ctx);
	} else if (req.body.header.namespace == 'AliGenie.Iot.Device.Discovery') {
		await handleDiscovery(ctx);
	} else if (req.body.header.namespace == 'AliGenie.Iot.Device.Query ') {
		await handleQuery(ctx);
	}
}

Gateway.prototype.handleQuery= async function(ctx){

}

Gateway.prototype.handleDiscovery= async function(ctx){
	let domoticz = await  request('http://192.168.1.174:8080/json.htm?type=devices&used=true&filter=all&favorite=1')
}

Gateway.prototype.handleControl= async function(ctx){
	
}

module.exports = new Gateway();