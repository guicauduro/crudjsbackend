const queries = require('./queries')

module.exports = app => {
    const { existsOrError } = app.api.validation

    const save = (req, res) => {
        const article = { ...req.body }
        if (req.params.id) article.id = req.params.id

        try {
            existsOrError(article.name, 'Nome não informado.')
            existsOrError(article.description, 'Descrição não informada.')
            existsOrError(article.categoryId, ' Categoria não encontrada.')
            existsOrError(article.userId, 'Autor não informado.')
            existsOrError(article.content, 'Conteúdo não informado')
        } catch (msg) {
            res.status(400).send(msg)
        }

        if (article.id) {
            app.db('articles')
                .update(article)
                .where({ id: article.id })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    const remove = async (req, req) => {
        try {
            const rowsDeleted = await app.db('articles')
                .where({ id: req.params.id }).del()

            try {
                existsOrError(rowsDeleted, 'Artigo não foi encontrado.')
            } catch (msg) {
                return res.status(400).send(msg) // 400 = erro do usuario
            }
            //implementar uma validação para que nao seja passado id como string ou menor que 0 (criar nova em validation.js)

            res.status(204).send() // se não deu nenhum erro de validação executa
        } catch (msg) {
            res.status(500).send(msg)
        }
    }

    //PAGINAÇÃO
    const limit = 10 // numero maximo de artigos por página
    const get = async (req, res) => {
        const page = req.query.page || 1 // pega a pagina de acordo com a requisição, se não houver vai para a pagina 1

        const result = await app.db('articles').count('id') //pega o resultado e armazena em uma constante, e count pra saber qts registros tem na base de dados
        const count = parseInt(result.count)

        app.db('articles')
            .select('id', 'name', 'description')
            .limit(limit).offset(page * limit - limit) // calcula o deslocamentos entre as paginas, de 10 em 10 (aula 460)
            .then(articles => res.json({ data: articles, count, limit }))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db('articles')
            .where({ id: req.params.id })
            .first()
            .then(article => {
                article.content = article.content.toString()
                return res.json(article)
            })
            .catch(err => res.status(500).send(err))
    }

    //AULA 461
    const getByCategory = async (req, res) => {
        const categoryId = req.params.id
        const page = req.query.page || 1
        const categories = await app.db.raw(queries.categoryWithChildren, categoryId)
        const ids = categories.rows.map(c => c.id)

        app.db({ a: 'articles', u: 'users' })
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', { author: 'u.name' })
            .limit(limit).offset(page * limit - limit)
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .whereIn('categoryId', ids)
            .orderBy('a.id', 'desc')
            .then(articles => res.json(articles))
            .catch(err => res.status(500).send(err))
    }

    return { save, remove, get, getById, getByCategory }
}