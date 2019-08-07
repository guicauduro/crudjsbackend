module.exports = app => {
    const save = (req, res) => {
        res.send('usuario salvo')
    }
    return { save }
}