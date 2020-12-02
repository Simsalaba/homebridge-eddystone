# homebridge-eddystone
With this Homebridge plugin you can use Eddystone tags with Apple HomeKit to get battery level and temperature.

## Installation
If you don't already have homebridge
```bash
sudo npm i -g homebridge
```
CD into this repo after you cloned it and run the following commands
```bash
npm install
sudo npm i -g
```

## Config

In your homebridge config you can add the accessories like this
```json

 "accessories": [

        {
            "accessory": "Eddystone",
            "name": "My Eddystone Tag",
            "id": "Your tag identifier goes here"
        },
        {
            "accessory": "Eddystone",
            "name": "My Eddystone Tag2",
            "id": "Your tag identifier goes here"
        }
  ]
```

## Supported features
- temperature
- battery level
- battery level alert