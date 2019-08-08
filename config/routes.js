module.exports = app => {
    app.route('/users')
        .post(app.api.user.save) //inserir
        .get(app.api.user.get) // pegar

    app.route('/users/:id')
        .put(app.api.user.save) // alterar
        .get(app.api.user.getById)

    app.route('/categories')
        .get(app.api.category.get)
        .post(app.api.category.save)

    // Cuidar com a ordem, os mais especificos devem vir antes dos mais genéricos
    app.route('/categories/tree')
        .get(app.api.category.getTree)

    app.route('/categories/:id')
        .get(app.api.category.getById)
        .put(app.api.category.save)
        .delete(app.api.category.remove)

}