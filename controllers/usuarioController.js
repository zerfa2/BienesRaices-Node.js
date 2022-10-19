import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import Usuario from '../models/UsuarioModel.js'

import { generarId, generarJWT } from '../helpers/token.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res, next) => {
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req)
    await check('password').notEmpty().withMessage('El Password es Obligatorio').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado este vacio
    console.log(resultado)
    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    // Comprobar si el usuario existe
    const { email, password } = req.body

    const usuario = await Usuario.findOne({
        where: {
            email: email
        }
    })

    if (!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El Usuario no existe' }]
        })
    }

    // Comprobar si el usuario esta confirmado o activada
    if (!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada' }]
        })
    }
    console.log(usuario.verificarPassword(password))

    // Revisar el password
    if (!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El password es incorrecto' }]
        })
    }

    // Autenticar al usuario
    // modulos npm keycloak-js | passport +500 formas de autentificar incluyendo fb google , no esta muy bien documentado| jsonwebtoken
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre })

    // Almacenar jwt en localstorage o cookie

    console.log(token)
    return res.cookie('_token', token, {
        httpOnly: true,
        // secure: true,
        sameSite:true
    }).redirect('/mis-propiedades')
    
}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) => {

    // Validacion
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req)
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)
    await check('password').isLength({ min: 6 }).withMessage('El password  debe ser de al menos 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los Passwords no son iguales').run(req)

    let resultado = validationResult(req)
    // return res.json(resultado.array())
    // Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        // Errores
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    // Extraer los datos
    const { nombre, email, password } = req.body

    // Verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({
        where: {
            email: email
        }
    })


    if (existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            errores: [{ msg: 'El usuario ya esta registrado' }],
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    // return res.json(existeUsuario)
    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    // Envia email de confirmacion 
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    // Mostrar mensaje de confirmacion 
    res.render('templates/mensaje', {
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos Enviado un Email de Confirmación, presione en el enlace'
    })

    // res.json(usuario)
    // res.send({msg:"success"})
}

// Funcion q comprueba una cuenta
const confirmar = async (req, res, next) => {
    const { token } = req.params
    // res.json({ msg: token })
    console.log(token)
    // Verificar si el token es valido

    const usuario = await Usuario.findOne({
        where: {
            token: token
        }
    })

    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu Cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    // Confirmar la cuenta
    usuario.token = null
    usuario.confirmado = true
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmó correctamente',
        error: false
    })


    // Para ir al siguiente middleware
    // next();
}


const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: "Recupera tu acceso a Bienes Raices",
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) => {

    // Validacion
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)

    let resultado = validationResult(req)
    if (!resultado.isEmpty()) {
        res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { email } = req.body

    // Buscar al usuario
    const usuario = await Usuario.findOne({
        where: {
            email: email
        }
    })
    console.log(usuario)
    if (!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{ msg: "El email no pertenece a ningún usuario" }]
        })
    }

    // Generar un token y enviar el email
    usuario.token = generarId()
    await usuario.save()

    // Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    // Renderizar un mensaje
    res.render('templates/mensaje', {
        pagina: 'Restablece tu Password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    })

}

const comprobarToken = async (req, res, next) => {
    const { token } = req.params
    const usuario = await Usuario.findOne({
        where: {
            token
        }
    })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece tu password',
            mensaje: 'Hubo un error al validar tu información, intenta de nuevo',
            error: true
        })
    }

    // Mostrar formulario para modificar password
    res.render('auth/reset-password', {
        pagina: 'Restablece Tu Password',
        csrfToken: req.csrfToken()
    })

}
const nuevoPassword = async (req, res) => {
    // Validar el password
    await check('password').isLength({ min: 6 }).withMessage('El password  debe ser de al menos 6 caracteres').run(req)
    let resultado = validationResult(req)

    // Verificar q el resultado este vacio
    if (!resultado.isEmpty()) {
        // Errores
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu password cuenta',
            errores: resultado.array(),
            csrfToken: req.csrfToken()
        })
    }

    // Extraer los datos
    const { token } = req.params
    const { password } = req.body

    // Identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token: token } })

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null
    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        pagina: 'Pasword Restablecido',
        mensaje: 'El password se guardó correctamente'
    })

}

export {
    formularioLogin,
    autenticar,

    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,

    comprobarToken,
    nuevoPassword
}
