import jwt from 'jwt-simple'
import moment from 'moment'
import app from './../app'

exports.crearToken = (usuario) => {
    const payload = {
        sub: usuario._id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        iat: moment().unix(),
        exp: moment().add(8, 'hours').unix
    }

    return jwt.encode(payload, app.locals.token)
}