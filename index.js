const app = require('express')()
const consign = require('consign')
const db = require('./config/db')

app.db = db //coloca o todas as configuracoes do banco (knex) no app.db, podendo fazer os comandos de banco com ele

consign()
    .then('./config/middlewares.js')
    .then('./api')
    .then('./config/routes.js')
    .into(app)


app.listen(3000, () => {
    console.log('backend')
})