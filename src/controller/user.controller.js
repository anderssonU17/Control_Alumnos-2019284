'use strict'

const Usuarios = require('../models/user.model');
const Curses = require('../models/curses.model');
const bcrypt = require('bcrypt');
const { generateJWT } = require('../../../Proyecto-nodejs/src/helpers/create-jwt');

const createUser = async(req, res) => {
    const {username, email, password} = req.body;
    try{
        let usuario = await Usuarios.findOne({email: email}); // Usuarios viene del modelo | usuario es un alias
        if(usuario){
            return res.status(400).send({
                message: 'Un usuario ya existe con este correo', 
                ok: false, 
                usuario: usuario,
            });
        }
        usuario = new Usuarios(req.body);

        //Encriptar contrasenia
        const saltos = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync(password, saltos);

        // Guardar Usuarios
        usuario = await usuario.save();

        //generar token
        const token = await generateJWT(usuario.id, usuario.username, usuario.email);
        res.status(200).send({
        message: `Usuario ${usuario.username} creado correctamente`,
        usuario,
        token: token,
        });

        res.status(200).send({
            message: `Usuario ${username}creado correctamente`,
            ok: true, 
            usuario: usuario,
        })

    }catch(err){
        console.log(err)
        res.status(500).json({
            ok: false, 
            message: `No se ha creado el usuario: ${username}`, 
            error: err,
            
        });
    }
}

const readUser = async (req, res) => {
    try{
        const user = await Usuarios.find();

        if(!user){
            res.status(404).send({message: 'No hay usuarios disponibles'})
        }else {
            res.status(200).json({'Usuarios encontrados': user})
        }
    }catch(err){
        throw new Error(err)
    }
}

const loginUser = async(req, res) => {
    const {email, password} = req.body;
    try{
        const user = await Usuarios.findOne({email});
        if(!user){
            return res
            .status(400)
            .send({ok: false, message: "El usuario no existe"});
        }
        const validPassword = bcrypt.compareSync(
            password,
            user.password
        )
        if(!validPassword){
            return res
            .status(400)
            .send({ok: false, message: "password incorrecto"});
        }
        const token = await generateJWT(user.id, user.username, user.email);
        res.json({
            ok: true, 
            uid: user.id, 
            name: user.username, 
            email: user.email, 
            token, 
            message: `Te has logeado correctamente, bienvenido ${user.username}`
        })
    }catch(err){
        throw new Error(err);
    }
}

const editUser = async(req, res) =>{
    if(req.user.rol === "ALUMNO"){
        try{
            const id = req.params.id;
            const userEdit = {...req.body}; // viene directamente de la ruta 
            //Encriptar la contrasenia 
            userEdit.password = userEdit.password
            ? bcrypt.hashSync(userEdit.password, bcrypt.genSaltSync())
            : userEdit.password;
    
            const userComplete = await Usuarios.findByIdAndUpdate(id, userEdit, {
                new: true, // Nos regresa el nuevo registro
            });
            if (userComplete){
                const token = await generateJWT(userComplete.id, userComplete.username, userComplete.email);
                return res.status(200).send({
                    message: 'Usuario actualizado correctamente', userComplete, token});
            }else {
                res.status(404).send({
                    message: 'Este usuario no existe en la base de datos'
                });
            }
        }catch(err){
            throw new Error(err);
        }
    }else {
        return res.status(200).send({message: 'Eres maestro, no tienes permiso para cambiar el perfil'});
    }
    
}


const deleteUser = async (req, res) => {
    if(req.user.rol === "ALUMNO"){
        const userId = req.params.id;
    try {
    const user = await Usuarios.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "Alumno no encontrado" });
    }

      // Eliminar el usuario de cada curso en el que esté inscrito
    await Curses.updateMany(// updateMany es una funcion que actualiza las colecciones donde los nombres o criterios coincidan
        { students: userId },
        { $pull: { students: userId } }
    );

      // Eliminar el usuario de la lista de cursos en el modelo user
    user.courses = [];

      // Eliminar el usuario del modelo user
    await user.remove();

    return res.json({ message: "Alumno eliminado" });
    } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Ha ocurrido un error" });
    }
    }else {
        return res.status(500).send({message: 'Eres maestro, no tienes permiso de eliminar al alumno'})
    }
    
};
module.exports = {createUser, readUser, loginUser, editUser, deleteUser};