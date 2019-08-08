const { authSecret } = require('../.env')
const passport = require('passport')
const passportJwt = require('passport-jwt')
const { Strategy, ExtractJwt } = passportJwt // extrai o token da requisição

module.exports = app => {
    const params = {
        secretOrKey: authSecret, // o segredo que decodifica o token
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() // pega o token e extrai
    }

    const strategy = new Strategy(params, (payload, done) => { // pauload do sigin (auth.js)
        app.db('users')
            .where({ id: payload.id })
            .first()
            .then(user => done(null, user ? { ...payload } : false)) // se o user estiver setado ele retorna payload
            .catch(err => done(err, false))
    })

    passport.use(strategy)

    return {
        authenticate: () => passport.authenticate('jwt', { session: false })
    }
}

//aula 463