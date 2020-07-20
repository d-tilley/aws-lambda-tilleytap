var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});

var ddb = new AWS.DynamoDB.DocumentClient();

module.exports.main = async (event, context, callback) => {
  console.log("Event published:", event);

  let sensor = await getSensor(event);

  await updateSensor(sensor, event);

  callback(null, getBaseResponse());
};

async function getSensor(event) {
  let params = {
    TableName: 'tilleytap',
    Key: {
      _id: event.deviceId
    }
  };

  let data = await ddb.get(params).promise();
  return data.Item;
}

async function updateSensor(sensor, event) {
  let params = {
    TableName: 'tilleytap',
    Key: {
      _id: event.deviceId
    },
    UpdateExpression: 'SET metadata = :metadata',
    ExpressionAttributeValues:{
      ':metadata': getSensorPayload(sensor, event)
    }
  };

  await ddb.update(params).promise();
}

function getSensorPayload(sensor, event) {
  return {
    weight: event.weight,
    temperature: event.temperature,
    fullWeight: sensor.metadata.fullWeight ? sensor.metadata.fullWeight : event.weight,
    breweryDbId: sensor.metadata.breweryDbId,
    kegType: sensor.metadata.kegType,
    timestamp: getNowTimestamp(),
    lastBeerPour: getLastBeerPour(sensor, event)
  };
}

function getLastBeerPour(sensor, event) {
  // Return new date if last pour is missing or difference is greater the 4oz (0.25lbs)
  if (!sensor.metadata.lastBeerPour ||
    (sensor.metadata.weight - event.weight) > 0.25) {
    return getNowTimestamp();
  }

  return sensor.metadata.lastBeerPour
}

function getNowTimestamp() {
  return Math.floor(new Date() / 1000).toString();
}

// We'll always return a 200 here
function getBaseResponse() {
  return {
    'statusCode': 200,
    'headers': {
      'Access-Control-Allow-Origin': '*'
    },
    'isBase64Encoded': false
  };
}
