const irsdk = require('irsdk-node');

console.log('Initializing iRacing SDK...');

const sdk = new irsdk.IRacingSDK();
sdk.autoEnableTelemetry = true;

console.log('Waiting for iRacing connection...');

setInterval(() => {
    if (irsdk.IRacingSDK.IsSimRunning()) {
        if (sdk.startSDK()) {
            console.log('Sim found and SDK started!');

            if (sdk.waitForData(100)) {
                const telemetry = sdk.getTelemetry();
                const session = sdk.getSessionData();

                if (telemetry) {
                    console.log('--- Telemetry Captured ---');
                    // HELPER: Normalize raw SDK values
                    const unwrap = (val) => {
                        if (val && typeof val === 'object' && Array.isArray(val.value)) {
                            return val.value[0];
                        }
                        return val;
                    };

                    console.log('--- Telemetry Captured & Normalized ---');
                    console.log(`RPM: ${unwrap(telemetry.RPM).toFixed(0)}`);
                    console.log(`Speed: ${(unwrap(telemetry.Speed) * 3.6).toFixed(1)} km/h`);
                    console.log(`Gear: ${unwrap(telemetry.Gear)}`);

                    const carIdx = unwrap(telemetry.DriverCarIdx);
                    console.log(`DriverCarIdx: ${carIdx}`);

                    process.exit(0);
                }

                if (session) {
                    console.log('--- Session Info ---');
                    try {
                        const track = session.WeekendInfo.TrackDisplayName;
                        const carIdx = telemetry.DriverCarIdx;
                        const car = session.DriverInfo.Drivers[carIdx].CarScreenName;
                        console.log(`Track: ${track}`);
                        console.log(`Car: ${car}`);
                    } catch (e) {
                        console.log('Session info partial: ', e.message);
                    }
                }
            } else {
                console.log('Connected, but waiting for data...');
            }
        } else {
            console.log('Sim running, but SDK failed to start (or already active).');
        }
    } else {
        console.log('iRacing Simulator is NOT running.');
    }
}, 1000);
