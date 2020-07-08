var request = require('request-promise');

// A map of BreweryDb beer info will be cached across function invocations.
// This cache is only applicable to the specific Lambda function's container (ie, scaling).
let cacheMap;

module.exports.main = async (event, context, callback) => {
  console.log('get-beerbyid', JSON.stringify(event));

  if (!cacheMap) {
    cacheMap = new Map(); // Initialize cache
  }
  
  let beerId = event['pathParameters']['beerid'];
  let response = getBaseResponse();

  // Grab beer info from cache first. If not found, make api call to BreweryDb.
  if (cacheMap.has(beerId)) {
    response.body = JSON.stringify(cacheMap.get(beerId));
    response.statusCode = 200;
  } else {
    let msg = await getBeerFromBreweryDb(beerId);
    response.body = JSON.stringify(msg.body);
    response.statusCode = msg.statusCode;
  }

  console.log('Response', JSON.stringify(response));
  callback(null, response);
};

async function getBeerFromBreweryDb(beerId) {
  let url = new URL(`https://api.brewerydb.com/v2/beer/${beerId}`);
  url.searchParams.append('key', process.env.BREWERYDB_API_KEY);
  url.searchParams.append('withBreweries', 'Y');

  let msg = {};

  await request(url.href)
    .then(data => {
      msg.body = data;
      msg.statusCode = 200;
      cacheMap.set(beerId, data); // Store beer info in cache
    })
    .catch(err => {
      msg.body = err.message;
      msg.statusCode = (err.statusCode != null) ? err.statusCode : 500;
    });

  return msg;
}

function getBaseResponse() {
  return {
    'headers': {
      'Access-Control-Allow-Origin': '*'
    },
    'isBase64Encoded': false
  };
}
