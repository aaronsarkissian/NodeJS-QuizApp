import * as http from 'http';
import app from './app';
import io from './sockets/challenge';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

io.listen(server);
server.listen(port);

export = server;
