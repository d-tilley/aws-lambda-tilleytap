var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});

var ddb = new AWS.DynamoDB.DocumentClient();

module.exports.main = async (event, context, callback) => {
  console.log('get-user', JSON.stringify(event));

  let response = getBaseResponse();
  
  let userId = event['pathParameters']['userid'];
  let user = await getUser(userId);

  if (user != null) {
    let body = {
      'id': user._id,
      'metadata': user.metadata
    };
    response.body = JSON.stringify(body);
    response.statusCode = 200;
  } else {
    response.statusCode = 404;
  }
  
  console.log('Response', JSON.stringify(response));
  
  callback(null, response);
};

async function getUser(userId) {
  let params = {
    TableName: 'tilleytap',
    Key: {
      _id: userId
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
