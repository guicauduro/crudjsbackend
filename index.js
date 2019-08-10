const app = require('express')()
const consign = require('consign')
const db = require('./config/db')
const mongoose = require('mongoose')

require('./config/mongodb')

app.db = db //coloca o todas as configuracoes do banco (knex) no app.db, podendo fazer os comandos de banco com ele
app.mongoose = mongoose

consign()
    .then('./config/middlewares.js')
    .then('./api/validation.js')
    .then('./api')
    .then('./config/routes.js')
    .into(app)


app.listen(3000, () => {
    console.log('backend')
})