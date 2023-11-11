console.log('hello');
console.log('you have a fax');

import express from 'express';
import path from 'path';

const app = express();
app.get('/', (req, res) => res.send('no this is a real server now be serious.'));

app.get('/HorribleGame', express.static(path.join(__dirname, '../HorribleGame')));

app.listen(8085, () => console.log('yeah'));