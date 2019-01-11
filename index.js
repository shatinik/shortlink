const express = require('express');
const URL = require('url');
const http = require('http');
const https = require('https');
const http2 = require('http2');
const xpath = require('xpath');
const parse5 = require('parse5');
const xmlser = require('xmlserializer');
const dom = require('xmldom').DOMParser;

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

const getContent = (url, ver) => new Promise((resolve, reject) => {
  switch (ver) {
    case 'http': {
      break;
    }
    case 'https': {
      break;
    }
    case 'http2': {
      try {
        const client = http2.connect(url);

        const req = client.request({
          [http2.constants.HTTP2_HEADER_SCHEME]: "https",
          [http2.constants.HTTP2_HEADER_METHOD]: http2.constants.HTTP2_METHOD_GET,
          [http2.constants.HTTP2_HEADER_PATH]: `/`
        });
  
        let data = [];
        req.on('data', (chunk) => {
            data.push(chunk);
        });
        req.end();
        req.on('end', () => {
          resolve({data: data.join()});
        });
        
        break;
        
      } catch (e) {
        reject({e});
        break;
      }
    }
    default: {
      reject({ error: `${ver} is not supported`});
      break;
    }
  }
})

function parse(tpl, html) {
  const document = parse5.parse(html);
  const xhtml = xmlser.serializeToString(document);
  const doc = new dom().parseFromString(xhtml);
  const select = xpath.useNamespaces({"x": "http://www.w3.org/1999/xhtml"});
  return nodes = select(tpl, doc);
}

app.get('/parse', async (req, res) => {
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
      switch (url.pathname) {
        default: {
          message = `Path: ${url.pathname} is not supported for Host: ${url.host}`;
          break;
        }
      }
      try {
        let html = await getContent(url, 'http2');
        let parsed = parse('//*[@id="page"]/div[2]/div[2]/section/div/div[2]/div[1]/div[1]/span[1]/div[1]', html);
        message = `Parsed value: ${parsed}`;
      } catch (e) {
        console.log(e);
        res.status(500).send();
      }
      
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
