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

function requestBluetoothDevice() {
    log('Requesting bluetooth device...');

    return navigator.bluetooth.requestDevice({
        acceptAllDevices: true
    }).
        then(device => {
            log('"' + device.name + '" bluetooth device selected');
            deviceCache = device;

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

            return server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
        }).
        then(service => {
            log('Service found, getting characteristic...');

            return service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
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

// Launch Bluetooth device chooser and connect to the selected
function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(error));
}

// Disconnect from the connected device
function disconnect() {
    //
}

// Send data to the connected device
function send(data) {
    //
}
