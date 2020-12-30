import express from 'express'
import multipart from 'connect-multiparty'
import middlewareAuth from './../middlewares/auth'
import ControladorUsuario from '../controllers/usuario'

const router = express.Router();

const upload = multipart({uploadDir: './src/uploads/usuarios'})

// Rutas
router.get('/home', middlewareAuth.auth, ControladorUsuario.home);
router.post('/login', ControladorUsuario.login);
router.post('/insertar-usuario', middlewareAuth.auth, ControladorUsuario.insertarUsuario);
router.get('/usuarios/:pagina?', middlewareAuth.auth, ControladorUsuario.obtenerUsuarios);
router.get('/usuario/:id', middlewareAuth.auth, ControladorUsuario.obtenerUsuario);
router.put('/actualizar-usuario/:id', middlewareAuth.auth, ControladorUsuario.actualizarUsuario);
router.post('/subir-imagen-usuario/:id', [middlewareAuth.auth, upload], ControladorUsuario.subirImagen);
router.get('/obtener-imagen-usuario/:imagen', ControladorUsuario.obtenerImagen);
router.delete('/eliminar-usuario/:id', middlewareAuth.auth, ControladorUsuario.eliminarUsuario);

export default router
