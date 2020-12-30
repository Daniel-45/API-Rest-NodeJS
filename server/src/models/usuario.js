import mongoose from 'mongoose'

const Schema = mongoose.Schema;

let UsuarioSchema = Schema({
    nombre: String,
    apellidos: String,
    email: String,
    password: String,
    imagen: String
})

export default mongoose.model('Usuario', UsuarioSchema);