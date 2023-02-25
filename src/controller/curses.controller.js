'use strict'

const Curses = require('../models/curses.model');
const Usuarios = require('../models/user.model');

const createCurse = async (req, res) => {
    const {name, teacher, students} = req.body;
    try{
        let curse = await Curses.findOne({name}); // Es el nombre que esta en el modelo
        if (curse){
            return res.status(400).send({
                message: 'El curso ya lo tiene un profesor', 
                ok: false, 
                curse: curse,
            });
        }
        curse = new Curses({name, teacher, students});
        curse = await curse.save();

        res.status(200).send({
            message: `Curso creado Correctamente`, 
            ok: true, 
            cursos: curse,
        });

    }catch(err){
        console.log(err);
        res.status(500).json({
            ok: false, 
            message: `No se ha creado el curso`, 
            error: err,
        });
    }
}
const readCourses = async(req, res) => {
    try{
    const courses = await Curses.find();

    if(!courses){
        res.status(404).send({message: 'No hay cursos disponibles'});
    }else {
        res.status(200).json({'Cursos encontrados': courses})
    }
    }catch(err){
        throw new Error(err);
    }
}
const cursoProfesor = async (req, res) => {
    if(req.user.rol === "PROFESOR"){
        const {username, name} = req.params;
        try{
            let teacher = await Usuarios.findOne({username});
            let course = await Curses.findOne({name});
    
            if(!teacher){
                return res.status(404).send({message: 'Profesor no existe'});
            }
            if(!course){
                return res.status(404).send({message: 'Curso no existe'});
            }
            course.teacher = teacher;
            teacher.course = course;
            await course.save();
            await teacher.save();
    
    
            res.status(200).send(course);
        }catch(err){
            throw new Error('Error al actualizar el curso' + err);
        }
    }else {
        return res.status(200).send({message: 'Eres alumno, no tienes permiso para asignar curso'});
    }
}

const assignStudent = async (req, res) => {
    if(req.user.rol === "PROFESOR"){
        try {
            const { username, name } = req.body;
            // Buscar al usuario por su nombre de usuario
            const user = await Usuarios.findOne({ username });
        
            // Buscar el curso por su nombre
            const course = await Curses.findOne({name });
        
            // Verificar que el usuario no esté ya inscrito en el curso
            if (user.courses.includes(course._id)) {
            return res.status(400).json({ error: 'El usuario ya está inscrito en este curso.' });
            }
            
            if(user.courses.length >= 3){
                return res.status(400).json({error: 'El usuario ya esta asignado a 3 cursos'})
            }
        
            // Agregar al usuario en la lista de estudiantes del curso
            course.students.push(user._id);
            await course.save();
        
            // Agregar el curso en la lista de cursos del usuario
            user.courses.push(course._id);
            await user.save();
        
            return res.status(200).json({ message: 'El usuario ha sido inscrito en el curso exitosamente.' });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Ha ocurrido un error al intentar inscribir al usuario en el curso.' });
        }
    }else {
        return res.status(200).send({message: 'Eres alumno, no tienes permiso para asignar estudiantes'});
    }

};

const editCourse = async(req, res) => {
    if(req.user.rol === "PROFESOR"){
        try{
            let editCourse = req.body;
            const id = req.params.id;
            const coursesModify = Curses.findById(id);
    
            if(!coursesModify){
                res.status(400).send({message: 'Este curso no existe en la DB'});
            }else {
                const courseComplete = await Curses.findByIdAndUpdate(id, editCourse, {new: true});
    
                res.status(200).send({message: 'Curso actualizado correctamente', courseComplete});
            }
        }catch(err){
            throw new Error('Error al actualizar el usuario' + err);
        }
    }else {
        return res.status(200).send({message: 'Eres alumno, no tienes permiso para editar este curso'});
    }
}


const deleteCourse = async (req, res) => {
    if(req.user.rol === "PROFESOR"){
        try {
            const course = await Curses.findById(req.params.id);
            if (!course) {
                return res.status(404).json({ error: "El curso no existe" });
            }
        
              // Eliminar el curso de cada usuario que lo tenga asignado
            await Usuarios.updateMany(
                { courses: { $in: [course._id] } },// el in se utiliza para buscar los usuarios que tengan el curso eliminado
                { $pull: { courses: course._id } }// el pull se utiliza para eliminar el curso de la lista de cursos de cada usuario encontrado
            );
        
            await course.remove();
            res.json({ message: "Curso eliminado correctamente" });
            } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Error al eliminar el curso" });
            }
    }else {
        return res.status(200).send({message: 'Eres alumno, no tienes permiso para eliminar el curso'});
    }
    
};

module.exports = {createCurse, cursoProfesor, readCourses, assignStudent, editCourse, deleteCourse}