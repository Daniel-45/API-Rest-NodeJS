import cors from 'cors'
import logger from 'morgan'
import express from 'express'
import { config } from 'dotenv'
import bodyParser from 'body-parser'
import rutasUsuarios from './routes/usuarios'

const app = express();

const SETTINGS = config()

app.disable('x-powered-by');
app.set('env', SETTINGS.parsed.ENV);
app.set('token', SETTINGS.parsed.TOKEN);
app.set('config', SETTINGS.parsed);
app.locals.env = app.get('env');
app.locals.token = app.get('token');
app.locals.config = app.get('config');

if (process.env.NODE_ENV !== 'test') {
    app.use(logger('combined'));
}

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended: false }));

app.use(cors());

// Rutas
app.use('/api', rutasUsuarios);

export default app