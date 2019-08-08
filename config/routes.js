module.exports = app => {
    app.route('/users')
        .post(app.api.user.save) //inserir
        .get(app.api.user.get) // pegar

    app.route('/users/:id')
        .put(app.api.user.save) // alterar
}