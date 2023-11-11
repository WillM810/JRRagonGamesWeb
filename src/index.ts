console.log('hello');
console.log('you have a fax');

import express from 'express';

const app = express();
app.get('/', (req, res) => res.send('no this is a real server now be serious.'));

app.listen(80, () => console.log('yeah'));