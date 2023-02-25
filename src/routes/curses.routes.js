'use strict'

const {Router} = require('express');
const { createCurse, cursoProfesor, readCourses, assignStudent, editCourse, deleteCourse } = require('../controller/curses.controller');
const {check} = require('express-validator');
const {validateParams} = require('../middlewares/validate-params'); 
const { validateJWT } = require('../middlewares/validate-jwt');

const api = Router();

api.post('/create-curse', createCurse);
api.post('/asign-teacher/:name/teacher/:username', validateJWT, cursoProfesor);
api.get('/read-course', readCourses);
api.post('/asign-students', validateJWT, assignStudent);
api.put('/edit-course/:id', validateJWT ,editCourse);
api.delete('/delete-course/:id', validateJWT, deleteCourse)

module.exports = api;

