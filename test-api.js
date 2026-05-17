const http = require('http');

http.get('http://localhost:3001/api/consultations', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(json.slice(0, 2));
    } catch(e) {
      console.log('Parse error:', e);
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
