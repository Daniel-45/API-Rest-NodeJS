import app from './app'
import mongoose from 'mongoose'

let _server;

const server = {
    start() {
        const PORT = 9000;

        mongoose.set('useFindAndModify', false);
        mongoose.Promise = global.Promise;
        mongoose.connect('mongodb://localhost:27017/api-rest-node', { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => {
                _server = app.listen(PORT, () => {
                    if (process.env.NODE_ENV !== 'test') {
                        console.log(`Servidor escuchando en http://localhost:${PORT}`);
                    }
                })
            })
            .catch(error => console.log(error));

    },
    close() {
        _server.close();
    }
}

export default server

if (!module.require.main) {
    server.start();
}
