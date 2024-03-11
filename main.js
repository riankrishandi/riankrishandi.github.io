// Get references to UI elements
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');

// Connect to the device on Connect button click
connectButton.addEventListener('click', function () {
    connect();
});

// Disconnect from the device on Disconnect button click
disconnectButton.addEventListener('click', function () {
    disconnect();
});

// Handle form submit event
sendForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form sending
    send(inputField.value); // Send text field contents
    inputField.value = '';  // Zero text field
    inputField.focus();     // Focus on text field
});

function log(data, type = '') {
    terminalContainer.insertAdjacentHTML('beforeend',
        '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}

// Selected device object cache
let deviceCache = null;

function handleDisconnection(event) {
    let device = event.target;

    log('"' + device.name +
        '" bluetooth device disconnected, trying to reconnect...');

    connectDeviceAndCacheCharacteristic(device).catch(error => log(error));
}

function requestBluetoothDevice() {
    log('Requesting bluetooth device...');

    return navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0x18F0]
    }).
        then(device => {
            log('"' + device.name + '" bluetooth device selected');
            deviceCache = device;

            deviceCache.addEventListener('gattserverdisconnected', handleDisconnection)

            return deviceCache;
        });
}

// Characteristic object cache
let characteristicCache = null;

function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    log('Connecting to GATT server...');

    return device.gatt.connect().
        then(server => {
            log('GATT server connected, getting service...');

            return server.getPrimaryService(0x18F0);
        }).
        then(service => {
            log('Service found, getting characteristic...');

            return service.getCharacteristic(0x2AF1);
        }).
        then(characteristic => {
            log('Characteristic found');
            characteristicCache = characteristic;

            return characteristicCache;
        });
}

// Enable the characteristic changes notification
function startNotifications(characteristic) {
    log('Starting notifications...');

    return characteristic.startNotifications().
        then(() => {
            log('Notifications started');
        });
}

let encoder = new ThermalPrinterEncoder({
    language: 'esc-pos',
    width: 48,
    wordWrap: true
});
let result = encoder
    .initialize()
    .text('The quick brown fox jumps over the lazy dog')
    .newline()
    .encode();

// Launch Bluetooth device chooser and connect to the selected
function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        then(characteristic => {
            characteristic.writeValue(result)
        }).
        catch(error => log(error));
}

// Disconnect from the connected device
function disconnect() {
    if (deviceCache) {
        log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
        deviceCache.removeEventListener('gattserverdisconnected', handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
            log('"' + deviceCache.name + '" bluetooth device disconnected');
        }
        else {
            log('"' + deviceCache.name +
                '" bluetooth device is already disconnected');
        }
    }

    characteristicCache = null;
    deviceCache = null;
}

// Send data to the connected device
function send(data) {
    
}
