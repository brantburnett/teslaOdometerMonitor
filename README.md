# Telsa Odometer Monitor

Super simple Lambda function which checks your Tesla's odometer and sends and SNS
notification if it is over a threshold. Designed to help you remember to rotate
your tires.

## Configuration

Configuration is entirely by environment variable.

| ENV VAR         | Description |
| -------         | ----------- |
| REFRESH_TOKEN   | OAuth refresh token for your Tesla |
| VEHICLE_ID      | Vehicle ID ("id" attribute from `https://owner-api.teslamotors.com/api/1/vehicles`) |
| TARGET_ODOMETER | Alerts at this odometer value or greater |
| SNS_TOPIC       | ARN of the SNS topic to notify |

## Deployment

The deployment is VERY manual. It is expected that the following conditions are met:

1. Lambda function is deployed with a role which has access to publish to the SNS topic
2. Lambda function has a timeout around 15s
3. Lambda function has the requirement environment variables above
4. Lambda function is configured to be triggered by Amazon EventBridge on a schedule

Example CRON schedule to check and notify every Sunday:

`cron(0 16 ? * SUN *)`

### Packaging

```sh
npm install # If node_modules isn't present
zip -r function.zip *
aws lambda update-function-code --function-name telsaOdometerMonitor --zip-file fileb://function.zip --profile brant --region us-east-1
```
