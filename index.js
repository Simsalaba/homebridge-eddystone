let Service;
let Characteristic;

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-eddystone', 'Eddystone', EddystonePlugin, true);
};

class EddystonePlugin {
    constructor(log, config) {
        this.eddyBs = require('@abandonware/eddystone-beacon-scanner');
        this.log = log;
        this.id = config.id;
        this.name = config.name;
        this.temperature = []; // celsius 
        this.vbatt = []; //millivolts
        this.vbattPercentage = []
        this.contacts = [];
        this.instanceId;

        var that = this;

        this.informationService = new Service.AccessoryInformation()
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, "1")
            .setCharacteristic(Characteristic.Model, "Eddystone UID TLM")
            .setCharacteristic(Characteristic.SerialNumber, "1");

        this.batteryService = new Service.BatteryService(this.name, "battery")
        this.batteryService
            .getCharacteristic(Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this))
        this.batteryService.setCharacteristic(Characteristic.ChargingState, Characteristic.ChargingState.NOT_CHARGEABLE)


        this.temperatureService = new Service.TemperatureSensor(this.name, "temperature")
        this.temperatureService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .on('get', this.getTemperature.bind(this))

        this.eddyBs.on('found', function (beacon) {
            console.log('found Eddystone Beacon:\n', JSON.stringify(beacon, null, 2));
            that.ParseAndUpdate(beacon);
        });

        this.eddyBs.on('updated', function (beacon) {
            that.ParseAndUpdate(beacon);
        });

        this.eddyBs.on('lost', function (beacon) {
        });

        this.eddyBs.startScanning(true, function (error) {
            if (error) {
                that.log('homebridge-eddystone: Error starting scanning.', error);
            } else {
                that.log('homebridge-eddystone: Scanning for services...');
            }
        });

    }

    ParseAndUpdate(beacon) {
        var dataPacket;
        if (beacon.id == this.id) {
            dataPacket = this.ParseEddystone(beacon);
        }
        this.instanceId = beacon.instance;
        if (dataPacket !== undefined) {
            if (dataPacket.vbatt !== undefined) {
                this.vbatt[this.instanceId] = dataPacket.vbatt;
            }
            if (dataPacket.temp !== undefined) {
                this.temperature[this.instanceId] = dataPacket.temp;
            }
            if (dataPacket.vbattPercentage !== undefined) {
                this.vbattPercentage[this.instanceId] = dataPacket.vbattPercentage;
            }

            const batteryState = (this.vbatt[this.instanceId] < 2200) ? 1 : 0;

            if (batteryState !== this.batteryState) {
                this.batteryState = batteryState;
                this.batteryService
                    .getCharacteristic(Characteristic.StatusLowBattery)
                    .updateValue(batteryState);
            }
        }
    }
    ParseEddystone(beacon) {
        var data = {}
        for (var prop in beacon) {
            if (prop !== "tlm") {
                data[prop] = beacon[prop];
            } else {
                for (var prop in beacon.tlm) {
                    data[prop] = beacon.tlm[prop];
                }
                data["vbattPercentage"] = this.getBatteryPercentage(data["vbatt"]);
            }
        }
        return data;
    };

    getBatteryPercentage(batValmV) {
        return (((1 / 12) * (parseInt(batValmV) - 2000)) | 0).toString();
    }

    getTemperature(callback) {
        callback(null, this.temperature[this.instanceId]);
    }

    getBatteryLevel(callback) {
        callback(null, this.vbattPercentage[this.instanceId]);
    }

    getServices() {
        const services = [];
        services.push(this.informationService);
        services.push(this.batteryService);
        services.push(this.temperatureService);
        return services;
    }
}
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});