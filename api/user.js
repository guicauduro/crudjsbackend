const bcrypt = require('bcrypt-nodejs')

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError } = app.api.validation

    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10) // gera o tempero que cria a hash
        return bcrypt.hashSync(password, salt) // retorna a senha criptografada
    }



    const save = async (req, res) => {
        const user = { ...req.body } // O body parser gera um usuario configurado, o mesmo foi pego usando sprad com todos atributos do body como se entivesse clonando o body
        if (req.params.id) user.id = req.params.id

        try {
            existsOrError(user.name, 'Nome não informado')
            existsOrError(user.email, 'E-mail não informado')
            existsOrError(user.password, 'Senha não informada')
            existsOrError(user.confirmPassword, 'Confirmação de senha inválida')
            equalsOrError(user.password, user.confirmPassword, 'Senhas não conferem')

            //Descobrir se o usuario já não esta cadastrado
            const userFromDB = await app.db('users') // app.db = knex
                .where({ email: user.email }).first() //O primeiro email que achar igual já no banco de dados
            if (!user.id) { //Se o usuário existir retorna a msg abaixo
                notExistsOrError(userFromDB, 'Usuário já cadastrado')
            }
        } catch (msg) { // se ocorrer erro em algum quesito acima
            return res.status(400).send(msg) // mostrar erro 400 que é do 'lado cliente'
        }

        user.password = encryptPassword(user.password)
        delete user.confirmPassword // exclui a confirmação de senha pois não precisa enviar

        if(user.id) { // 
            app.db('users')
                .update(user) // faz o update do usuario
                .where({ id: user.id }) // onde o id sera igual ao user.id
                .whereNull('deletedAt') //467
                .then(_ => res.status(204).send()) // Envia a resposta se tudo der certo
                .catch(err => res.status(500).send(err)) // caso caia no catch apresente o erro do 'lado servidor'
        } else {
            app.db('users')
                .insert(user) //insere o usuario
                .then(_ => res.status(204).send()) // Envia a resposta se tudo der certo
                .catch(err => res.status(500).send(err)) // caso caia no catch apresente o erro do 'lado servidor'
        }
    }

    const get = (req, res) => { // vai pegar todos os usuarios do sistema
        app.db('users')
            .select('id', 'name', 'email', 'admin') // ESSES NOMES ESTAO IGUAIS AOS NOMES DO BANCO DE DADOS, SE FOR DIFERENTE PRECISA TROCAR O THEN COM O 'MAP'
            .whereNull('deletedAt') //467
            .then(users => res.json(users))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => { // Busca usuario pelo ID
        app.db('users')
            .select('id', 'name', 'email', 'admin') 
            .where({ id: req.params.id })
            .whereNull('deletedAt')
            .first() // retorna apenas um unico resultado
            .then(user => res.json(user))
            .catch(err => res.status(500).send(err))
    }

    // SOFT DELETE 467
    const remove = async (req, res) => {
        try {
            const articles = await app.db('articles')
                .where({ userId: req.params.id })
            notExistsOrError(articles, 'Usuário possui artigos.')

            const rowsUpdated = await app.db('users')
                .update({deletedAt: new Date()})
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Usuário não foi encontrado.')

            res.status(204).send()
        } catch(msg) {
            res.status(400).send(msg)
        }
    }

    return { save, get, getById, remove }
}