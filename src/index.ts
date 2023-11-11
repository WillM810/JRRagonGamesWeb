console.log('hello');
console.log('you have a fax');

import express from 'express';

const app = express();
app.get('/', (req, res) => res.send('fuck'));

app.listen(80, () => console.log('yeah'));