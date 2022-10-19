import Sequelize from "sequelize";

import { DB_USER, DB_HOST, DB_PORT, DB_PASSWORD, DB_DATABASE, DB_TYPE } from './config.js'

const db = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_TYPE,
    define: {
        timestamps: true
    },
    pool: {
        max: 5, // num max conexion por user
        min: 0, // num min por user
        acquire: 30000, // tiempo max q tarda en elaborar la conexion, sino error
        idle: 10000 // tiempo max para q la conexion finalice si no hay actividades o peticiones, tiempo q debe transcurrir para liberar conexiones
    },
    operatorAliases: false
})


export default db
