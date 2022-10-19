// import express from 'express'
// const router = express.Router()
import { Router } from 'express'

import { formularioLogin, autenticar, formularioRegistro, formularioOlvidePassword, registrar, confirmar, resetPassword, comprobarToken, nuevoPassword } from '../controllers/usuarioController.js'
const router = Router()


router.get('/login', formularioLogin)
router.post('/login', autenticar)
router.get('/registro', formularioRegistro)
router.post('/registro', registrar)
router.get('/confirmar/:token', confirmar)

router.get('/olvide-password', formularioOlvidePassword)
router.post('/olvide-password', resetPassword)

// Almacena el nuevo password
router.get('/olvide-password/:token', comprobarToken)
router.post('/olvide-password/:token', nuevoPassword)

// router.get('/login', (req, res) => {
//     res.render('auth/login', {
//         autenticado: true
//     })
// })

// router.route('/')
//     .get((req, res) => {
//         res.json({msg:"Hola mundo nuevamente Method GET!"})
//     })
//     .post((req, res) => {
//         res.json({msg:"Method Post"})
//     })

export default router