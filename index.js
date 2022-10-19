import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'

import usuarioRouters from './routes/usuarioRoutes.js'
import db from './config/db.js'
import { cookie } from 'express-validator'

// Crea la app
const app = express()

// Habilitar lectura de datos de formularios
app.use(express.urlencoded({ extended: true }))
// bodyParser es otra dependencia, la cual antes express no tenia 
// app.use(bodyParser.urlencoded({ extended: true }))

// Habilitar Cookie Parser
app.use(cookieParser())

// Habilitar CSRF
app.use(csrf({ cookie: true }))


// Conexion a la base de datos
try {
    await db.authenticate();
    db.sync()
    console.log('Conexion correcta a la db')

} catch (err) {
    console.log('error')
    console.log(err)
}

// Habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

// Carpeta Publica
app.use(express.static('public'))

// Routing
app.use('/auth', usuarioRouters)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log('Server actived at port:', PORT)
})