
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const usuarioRoutes = require('./src/routes/usuario.routes');
const eventoRoutes = require('./src/routes/evento.routes');

console.log('Arquivo server.js carregado');
console.log(
    'Rotas de eventos:',
    eventoRoutes.stack
        .map(rota => rota.route?.path)
        .filter(Boolean)
);

app.get('/teste', (req, res) => {
    res.json({
        mensagem: 'Servidor correto funcionando!'
    });
});

app.use('/usuario', usuarioRoutes);
app.use('/evento', eventoRoutes);

app.use((req, res) => {
    console.log('Rota não encontrada:', req.method, req.originalUrl);

    res.status(404).json({
        erro: 'Rota não encontrada',
        metodo: req.method,
        caminho: req.originalUrl
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
