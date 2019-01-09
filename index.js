const express = require('express');
const crypto = require("crypto");
const Sequelize = require('sequelize');

const app = express();
const port = 80;
const maxLinkLength = 255; // в БД поле link типа letchar(255)
const randBytes = 4; // функцией randomBytes получаем байты и преобразуем в hex-строку из 8 символов. в БД стоит тип char(8)

if (!process.env.dblogin) {
  console.log(process.env);
  console.log('process.env.dblogin is not specified');
  return;
}

if (!process.env.dbpass) {
  console.log('process.env.dbpass is not specified');
  return;
}

const sequelize = new Sequelize('localhost', process.env.dblogin, process.env.dbpass, {
  host: 'localhost',
  dialect: 'mysql'
});

app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  let tpl = `<!doctype html>
  <html>
    <head>
      <title> Shortlink page</title>
    </head>
    <body>
      <form method="POST">
        <input type="url" placeholder="input your link here" name="link" maxlength="${maxLinkLength}">
        <input type="submit">
      </form>
    </body>
  </html>`;
  res.status(200).send(tpl));
}


app.post('/', async (req, res) => {
  if (!req.body.link) {
    res.status('400').send('link is not specified');
    return;
  } else if (req.body.link.length > maxLinkLength) {
    res.status('400').send(`link length greater than ${maxLinkLength}`);
    return;
  }
  let link = req.body.link;
  let valid = /^(ftp|http|https):\/\/[^ "]+$/.test(link);
  let short = '';
  let check = true;
  
  if (!valid) {
	res.status('400').send('link is not valid');
	return;
  }
  while (check) {
    short = crypto.randomBytes(4).toString('hex');
    matches = await sequelize.query('SELECT `id` FROM `sht_links` WHERE `short`=?', {
      replacements: [short], 
      type: sequelize.QueryTypes.SELECT 
    });
    if (matches.length == 0) {
      check = false;
    }
  }
  await sequelize.query('INSERT INTO `sht_links`(`link`, `short`) VALUES (?, ?)', {
    replacements: [link, short], 
    type: sequelize.QueryTypes.INSERT 
  });
  let tpl = `<!doctype html>
    <html>
      <head>
        <title> Shortlink page</title>
      </head>
      <body>
        Your link to ${link}: <a href="${short}">localhost/${short}</a>
      </body>
    </html>`;
  res.status(201).send(tpl);
});

app.get('*', async (req, res) => {
  let short = req.originalUrl.substr(1);
  if (short.length != 8 || !(/[0-9a-f]/.test(short))) {
    res.status('400').send('link is not valid');
	return;
  }
  let matches = await sequelize.query('SELECT `link` FROM `sht_links` WHERE `short`=?', {
    replacements: [short], 
    type: sequelize.QueryTypes.SELECT 
  });
  if (matches.length == 0) {
    res.status(404).send();
	return;
  }
  res.redirect(matches[0].link);
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
    app.listen(port, () => console.log(`App listening on port ${port}!`));
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
