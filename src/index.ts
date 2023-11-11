console.log('hello');
console.log('you have a fax');

import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

console.log(path.join(__dirname, '../../..HorribleGame'));
console.log(fs.readdirSync(path.join(__dirname, '../../../HorribleGame')));
app.use('/HorribleGame', express.static(path.join(__dirname, '../../../HorribleGame')));



app.get('/', (req, res) => res.send('no this is a real server now be serious.'));

app.listen(8085, () => console.log('yeah'));