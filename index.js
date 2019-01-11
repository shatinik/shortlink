const express = require('express');
const URL = require('url');

const app = express();
const port = 8005;

app.get('/', (req, res) => {
  let tpl = `<!doctype html>
  <html>
    <head>
      <title>Parser page</title>
    </head>
    <body>
      <form method="GET" action="/parse">
        <input type="url" placeholder="input your link here" name="link">
        <input type="submit">
      </form>
    </body>
  </html>`;
  res.status(200).send(tpl);
});
	
app.get('/parse', (req, res) => {
  let link = req.query.link;
  if (!link) {
    res.status('400').send('link is not specified');
    return;
  }
	
  let valid = /^(http|https):\/\/[^ "]+$/.test(link);
  if (!valid) {
    res.status('400').send('link is not valid');
    return;
  }
	
  let url = URL.parse(link);
  let message = '';
  switch (url.host) {
    case 'cryptorated.com': {
      let parsed = 4.2;
      message = `Parsed value: ${parsed}`;
      break;
    }
    default: {
      let host = url.host;
      message = `Host: ${host} is not supported`;
      break;
    }	  
  }
  let tpl = `<!doctype html>
  <html>
    <head>
      <title>Parser page</title>
    </head>
    <body>
      ${message}
    </body>
  </html>`;
  res.status(200).send(tpl);
});

app.get('*', async (req, res) => {
  res.redirect('/');
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
