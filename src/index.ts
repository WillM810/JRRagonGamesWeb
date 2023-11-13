import express from 'express';
import path from 'path';

const IS_DEV = process.env.NODE_ENV === 'development';
console.log(process.cwd());

const app = express();

app.use('/HorribleGame', express.static(path.join(__dirname, '../../../HorribleGame')));
app.use('/static/:path', (req, res) => res.send(path.join(process.cwd(), `../${req.params.path}`)));



app.get('/', (req, res) => res.send('no this is a real server now be serious.'));

app.listen(8085, () => console.log('Server Running.'));