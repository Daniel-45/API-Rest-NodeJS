import bcrypt from 'bcrypt'
import jwt from './../services/jwt'
import Usuario from '../models/usuario'
import fs from 'fs'
import path from 'path'
import paginacion from 'mongoose-pagination'

function validarEmail(email) {
    const resultado = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return resultado.test(email);
}

function home(req, res) {
    res.status(200).send({
        message: 'Api Rest con NodeJS'
    })
}

// Login de usuario
function login(req, res) {
    let params = req.body;
    let email = params.email;
    let password = params.password;

    if (!validarEmail(params.email)) {
        return res.status(400).send({ message: 'El formato de email introducido no es válido' });
    } else {
        email = params.email;
    }

    Usuario.findOne({ email: email })
        .exec((error, usuario) => {
            if (error) {
                return res.status(500).send({ message: "No se ha podido procesar la petición" });
            }

            if (usuario) {
                bcrypt.compare(password, usuario.password, (error, check) => {
                    if (check) {
                        if (params.token) {
                            // Generar y devolver token
                            return res.status(200).send({
                                token: jwt.crearToken(usuario)
                            });
                        } else {
                            // Devolver datos de usuario en claro
                            // Quitar contraseña del resultado
                            usuario.password = undefined;
                            return res.status(200).send({ usuario });
                        }

                    } else if (password !== usuario.password) {
                        return res.status(400).send({ message: "Password incorrecto" });
                    }
                });
            } else {
                return res.status(400).send({ message: "Email incorrecto" });
            }
        });
}

// Insertar usuario
function insertarUsuario(req, res) {
    let params = req.body;
    const usuario = new Usuario();

    if (params.nombre && params.apellidos && params.email && params.password) {
        usuario.nombre = params.nombre;
        usuario.apellidos = params.apellidos;
        if (!validarEmail(params.email)) {
            return res.status(400).send({ message: 'El formato de email introducido no es válido' });
        } else {
            usuario.email = params.email;
        }
        usuario.password = params.password;

        // Consulta para comprobar si ya existe un usuario con el email introducido al insertar un usuario
        Usuario.find({ email: usuario.email.toLowerCase() })
            .exec((error, usuarios) => {
                if (error) return res.status(500).send({ message: 'No se ha podido procesar la petición para guardar un usuario' });

                // Si existe un usuario con el mismo email
                if (usuarios && usuarios.length >= 1) {
                    return res.status(400).send({ message: 'El email introducido no está disponible' });
                } else {
                    // Si todo ok cifra password y guarda los datos
                    bcrypt.hash(params.password, 10, (error, hash) => {
                        usuario.password = hash;

                        usuario.save((error, almacenado) => {
                            if (error) {
                                return res.status(500).send({ message: 'No se ha podido procesar la petición para guardar un usuario' });
                            }

                            if (almacenado) {
                                return res.status(201).send({ usuario: almacenado });
                            } else {
                                return res.status(400).send({ message: 'No se ha podido registrar el usuario' });
                            }
                        });
                    });
                }
            });

    } else {
        return res.status(400).send({
            message: 'Todos los campos son obligatorios'
        });
    }
}

// Obtener un usuario por su id
function obtenerUsuario(req, res) {
    const userId = req.params.id;

    Usuario.findById(userId, (error, usuario) => {
        if (error) {
            return res.status(500).send({ message: 'No se ha podido procesar la petición para obtener un usuario' });
        }

        if (!usuario) {
            return res.status(404).send({ message: 'No existe el usuario en base de datos' });
        }

        return res.status(200).send({ usuario });
    })
}

// Obtener todos los usuarios
function obtenerUsuarios(req, res) {
    let pagina = 1;

    console.log(req.params.pagina)

    if (req.params.pagina) {
        pagina = req.params.pagina;
    }

    let itemsPorPagina = 6;

    Usuario.find()
        .sort('nombre')
        .paginate(pagina, itemsPorPagina, (error, usuarios, total) => {
            if (error) {
                return res.status(500).send({ message: 'No se ha podido procesar la petición para obtener el listado de usuarios' });
            }

            if (!usuarios) {
                return res.status(404).send({ message: 'No hay usuarios en base de datos' });
            }

            return res.status(200).send({
                usuarios,
                total,
                paginas: Math.ceil(total / itemsPorPagina)
            })
        })
}

// Actualizar usuario
function actualizarUsuario(req, res) {
    const usuarioId = req.params.id;
    const params = req.body;

    // Quitar la propiedad password
    delete params.password

    // Solo el propio usuario puede modificar sus datos
    if (usuarioId !== req.user.sub) {
        return res.status(403).send({ message: 'Prohibido!! No tiene permiso para actualizar los datos de usuario' });
    }

    if (!validarEmail(params.email)) {
        return res.status(400).send({ message: 'El formato de email introducido no es válido' });
    } else {
        params.email = params.email;
    }

    Usuario.findByIdAndUpdate(usuarioId, params, { new: true }, (error, usuarioActualizado) => {
        if (error) {
            return res.status(500).send({ message: 'No se ha podido procesar la petición para actualizar datos de usuario' });
        }

        if (!usuarioActualizado) {
            return res.status(404).send({ message: 'No existe el usuario en base de datos' });
        }

        return res.status(200).send({ usuario: usuarioActualizado });

    });
}

// Subir archivos imagen/avatar de usuario
function subirImagen(req, res) {
    let usuarioId = req.params.id;

    if (req.files) {
        const rutaArchivo = req.files.imagen.path;
        const divisionArchivos = rutaArchivo.split('\\');
        const nombreArchivo = divisionArchivos[3];
        const divisionExtension = nombreArchivo.split('\.');
        const extension = divisionExtension[1];

        // Solo el propio usuario puede modificar sus datos
        if (usuarioId !== req.user.sub) {
            return eliminarArchivos(res, rutaArchivo, 'Prohibido!! No tiene permiso para actualizar los datos de usuario');
            // return res.status(403).send({ message: 'Prohibido!! No tiene permiso para actualizar los datos de usuario' });
        }

        // Comprobar extension del archivo
        if (extension === 'png' || extension === 'jpg' ||
            extension === 'jpeg' || extension === 'gif') {
            // Actualizar documento de usuario logeado
            Usuario.findByIdAndUpdate(usuarioId, { imagen: nombreArchivo }, { new: true }, (error, usuarioActualizado) => {
                if (error) {
                    return res.status(500).send({ message: 'No se ha podido procesar la petición para actualizar datos de usuario' });
                }

                if (!usuarioActualizado) {
                    return res.status(404).send({ message: 'No existe el usuario en base de datos' });
                }

                return res.status(200).send({ usuario: usuarioActualizado });
            })
        } else {
            return eliminarArchivos(res, rutaArchivo, 'La extensión del archivo no es válida');
        }
    } else {
        return res.status(400).send({ message: 'No se ha podido subir la imagen' });
    }
}

// Obtener imagen de usuario
function obtenerImagen(req, res) {
    let imagen = req.params.imagen;
    let rutaArchivo = './uploads/usuarios/' + imagen;

    console.log(imagen);
    console.log(rutaArchivo);

    fs.exists(rutaArchivo, (exists) => {
        if (exists) {
            return res.senFile(path.resolve(rutaArchivo));
        } else {
            return res.status(404).send({ message: 'No existe la imagen de usuario' });
        }
    })
}

// Eliminar usuario
function eliminarUsuario(req, res) {
    const usuarioId = req.params.id;

    Usuario.findByIdAndDelete(usuarioId, (error) => {
        // Solo el propio usuario puede modificar sus datos
        if (usuarioId !== req.user.sub) {
            return res.status(403).send({ message: 'Prohibido!! No tiene permiso para eliminar el usuario' });
        }

        if (error) {
            return res.status(500).send({ message: 'No se ha podido procesar la petición para eliminar el usuario' });
        }

        return res.status(200).send({ message: 'Usuario eliminado correctamente' })
    });
}

// Función auxiliar para eliminar archivos
function eliminarArchivos(res, rutaArchivo, mensaje) {
    fs.unlink(rutaArchivo, (error) => {
        return res.status(400).send({ message: mensaje });
    })
}

module.exports = {
    home,
    login,
    insertarUsuario,
    obtenerUsuario,
    obtenerUsuarios,
    actualizarUsuario,
    subirImagen,
    obtenerImagen,
    eliminarUsuario
}