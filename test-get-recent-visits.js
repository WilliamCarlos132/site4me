const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/stats/recentVisits',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => {
    rawData += chunk;
  });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      console.log('Recent visits:', JSON.stringify(parsedData, null, 2));
      
      // 检查是否包含 ip 字段
      if (parsedData.length > 0) {
        const firstVisit = parsedData[0];
        if (firstVisit.hasOwnProperty('ip')) {
          console.log('✓ Success: Recent visits include IP addresses');
          console.log('First visit IP:', firstVisit.ip);
        } else {
          console.log('✗ Error: Recent visits do not include IP addresses');
        }
      }
    } catch (e) {
      console.error(`Error parsing response: ${e.message}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
