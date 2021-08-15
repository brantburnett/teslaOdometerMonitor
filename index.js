const got = require('got');
const { SNS } = require('@aws-sdk/client-sns');
const pkg = require('./package.json');

const USER_AGENT = `telsaOdometerMonitor/${pkg.version} (brantburnett)`;

const httpClient = got.extend({
    prefixUrl: 'https://auth.tesla.com',
    headers: {
        'user-agent': USER_AGENT
    }
});

const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;
const TARGET_ODOMETER = parseInt(process.env.TARGET_ODOMETER || '0', 10);
const SNS_TOPIC = process.env.SNS_TOPIC;
const AWS_REGION = process.env.AWS_REGION;

exports.handler = async (event) => {
    const refreshResponse = await httpClient.post('oauth2/v3/token', {
        json: {
            "refresh_token": REFRESH_TOKEN,
            "client_id": "ownerapi",
            "grant_type": "refresh_token",
            "scope": "openid email offline_access"
        }
    }).json();

    const accessToken = refreshResponse.access_token;
    console.log('Got access token');

    const authenticatedClient = got.extend({
        prefixUrl: 'https://owner-api.teslamotors.com/api/1',
        headers: {
            'authorization': `Bearer ${accessToken}`,
            'user-agent': USER_AGENT
        }
    });

    const vehicleData = (await authenticatedClient.get(`vehicles/${VEHICLE_ID}/vehicle_data`).json()).response;
    const odometer = vehicleData.vehicle_state.odometer;
    
    console.log(`Odometer: ${odometer}`);

    if (odometer >= TARGET_ODOMETER) {
        console.log(`Alerting ${SNS_TOPIC}...`);

        const sns = new SNS({ region: AWS_REGION });
        await sns.publish({
            Message:  `Your Telsa odometer is at ${Math.round(odometer)}, past the threshold of ${TARGET_ODOMETER}.`,
            Subject:  'Time to rotate your tires',
            TopicArn: SNS_TOPIC
        });
    }
};