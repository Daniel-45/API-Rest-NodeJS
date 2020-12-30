import jwt from 'jwt-simple'
import app from './../app'
import moment from 'moment'

exports.auth = function(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'Prohibido!! No tiene permiso' });
    }

    // Token que llega en la cabecera de la petición
    const token = req.headers.authorization;

    try {      
        // Decodificar token 
        const payload = jwt.decode(token, app.locals.token)

        if (payload.exp <= moment.unix()) {
            return res.status(401).send({ message: 'El token ha expirado'});
        }

        req.user = payload;
        
    } catch (error) {
        return res.status(401).send({ message: 'El token no es válido'});
    }

    next();
}