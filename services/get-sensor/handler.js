var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});

var ddb = new AWS.DynamoDB.DocumentClient();

module.exports.main = async (event, context, callback) => {
  console.log('get-sensor', JSON.stringify(event));
  
  let response = getBaseResponse();
  
  let sensorId = event['pathParameters']['sensorid'];
  let sensor = await getSensor(sensorId);
  
  if (sensor != null) {
    let body = {
      'id': sensor._id,
      'type': sensor.type,
      'data': sensor.data,
      'timestamp': sensor.timestamp,
      'metadata': sensor.metadata
    };
    response.body = JSON.stringify(body);
    response.statusCode = 200;
  } else {
    response.statusCode = 404;
  }
  
  console.log('Response', JSON.stringify(response));
  
  callback(null, response);
};

async function getSensor(sensorId) {
  let params = {
    TableName: 'tilleytap',
    Key: {
      _id: sensorId
    }
  };

  let data = await ddb.get(params).promise();
  return data.Item;
}

function getBaseResponse() {
  return {
    'headers': {
      'Access-Control-Allow-Origin': '*'
    },
    'isBase64Encoded': false
  };
}
