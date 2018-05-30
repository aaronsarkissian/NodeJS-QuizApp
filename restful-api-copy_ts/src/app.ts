import * as express from 'express';
const app = express();
import * as bodyParser from 'body-parser';
import mongoose = require('mongoose');
import * as morgan from 'morgan';

import 'dotenv/config';

import userRoutes from './routes/user';
import { router as challengeRoutes } from './routes/challenge';

mongoose.connect(`mongodb://aaronsarkissian:${process.env.MANGO_ATLAS_PW}@mycluster-shard-00-00-qc5b0.mongodb.net:27017,mycluster-shard-00-01-qc5b0.mongodb.net:27017,mycluster-shard-00-02-qc5b0.mongodb.net:27017/test?ssl=true&replicaSet=MyCluster-shard-0&authSource=admin`);

mongoose.Promise = global.Promise; // To use the default NodeJS promise instead of the mongoose one.

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

app.use('/user', userRoutes);
app.use('/challenge', challengeRoutes);

app.use((req, res, next) => {
    const error: any = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
});

export default app;
