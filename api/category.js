module.exports = app => {
    const { existsOrError, notExistsOrError } = app.api.validation // importando as validações

    const save = (req, res) => { // incluir ou alterar categoria
        const category = {
            id: req.body.id,
            name: req.body.name,
            parentId: req.body.parentId
        }
        
        if(req.params.id) category.id = req.params.id 

        try {
            existsOrError(category.name, 'Nome não informado')
        } catch(msg) {
            return res.status(400).send(msg)
        }

        if(category.id) { // se houver atualiza
            app.db('categories')
                .update(category)
                .where({ id: category.id })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        } else {
            app.db('categories') // se não houver cria
                .insert(category)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    const remove = async (req, res) => { // metodo pra remover
        try { // validações pra saber se pode ou não remover (VERIFICAR/BUSCAR POR SOFT DELETE - BOOKSHELF.JS)
            existsOrError(req.params.id, 'Código da Categoria não informado.')

            const subcategory = await app.db('categories') // verifica se a categoria tem sub-categorias
                .where({ parentId: req.params.id })
            notExistsOrError(subcategory, 'Categoria possui subcategorias.')

            const articles = await app.db('articles') // VERIFICA SE TEM ARTIGOS ASSOCIADOS
                .where({ categoryId: req.params.id })
            notExistsOrError(articles, 'Categoria possui artigos.')

            const rowsDeleted = await app.db('categories') //  tenta excluir
                .where({ id: req.params.id }).del()
            existsOrError(rowsDeleted, 'Categoria não foi encontrada.') // caso não exista retorna o erro

            res.status(204).send() // resposta se der certo
        } catch(msg) {
            res.status(400).send(msg)
        }
    }

    // CRIAÇÃO DO PERCURSO DAS CATEGORIAS (CAT1 > CAT 2 > FIMPERCURSO)
    const withPath = categories => { // recebe uma lista de categorias e devolve a categoria com algo a mais
        const getParent = (categories, parentId) => {
            const parent = categories.filter(parent => parent.id === parentId) // faz um filtro pegando exatamente o parent que está procurando
            return parent.length ? parent[0] : null 
        }

        const categoriesWithPath = categories.map(category => {
            let path = category.name // variavel precisa ser let pois altera frequentemente seu valor
            let parent = getParent(categories, category.parentId)

            while(parent) { // enquanto houver um parente
                path = `${parent.name} > ${path}`
                parent = getParent(categories, parent.parentId)
            }

            return { ...category, path }
        })

        //ORDENAÇÃO DAS CATEGORIAS
        categoriesWithPath.sort((a, b) => {
            if(a.path < b.path) return -1
            if(a.path > b.path) return 1
            return 0
        })

        return categoriesWithPath
    }

    //RETORNA AS CATEGORIAS COM O PATH (PERCURSO)
    const get = (req, res) => {
        app.db('categories')
            .then(categories => res.json(withPath(categories)))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db('categories')
            .where({ id: req.params.id })
            .first()
            .then(category => res.json(category))
            .catch(err => res.status(500).send(err))
    }


    // PARA MONTAR O MENU EM ARVORES
    const toTree = (categories, tree) => {
        if(!tree) tree = categories.filter(c => !c.parentId) 
        tree = tree.map(parentNode => { // Procura os filhos
            const isChild = node => node.parentId == parentNode.id
            parentNode.children = toTree(categories, categories.filter(isChild))
            return parentNode
        })
        return tree
    }

    // 
    const getTree = (req, res) => {
        app.db('categories')
            .then(categories => res.json(toTree(categories))) // res.json(toTree(withPath(categories)))
            .catch(err => res.status(500).send(err))
    }

    return { save, remove, get, getById, getTree }
}