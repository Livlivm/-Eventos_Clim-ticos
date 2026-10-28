
const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const existente = await prisma.usuario.findFirst({
            where: { email: emailNormalizado }
        });

        if (existente) {
            return res.status(409).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        const usuario = await prisma.usuario.create({
            data: {
                nome: nome.trim(),
                email: emailNormalizado,
                senha
            },
            select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
                dataCadastro: true
            }
        });

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso!",
            usuario
        });
    } catch (erro) {
        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar usuário."
        });
    }
};

const listar = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
                dataCadastro: true
            }
        });

        return res.status(200).json(usuarios);
    } catch (erro) {
        console.error("Erro ao listar usuários:", erro);

        return res.status(500).json({
            mensagem: "Erro ao listar usuários."
        });
    }
};

const buscar = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
                dataCadastro: true
            }
        });

        if (!usuario) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json(usuario);
    } catch (erro) {
        console.error("Erro ao buscar usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar usuário."
        });
    }
};

const atualizar = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, email, senha, tipo } = req.body;
        const dados = {};

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        if (nome !== undefined) dados.nome = nome;
        if (email !== undefined) {
            dados.email = email.trim().toLowerCase();
        }
        if (senha !== undefined) dados.senha = senha;
        if (tipo !== undefined) dados.tipo = tipo;

        const usuario = await prisma.usuario.update({
            where: { id },
            data: dados,
            select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
                dataCadastro: true
            }
        });

        return res.status(200).json(usuario);
    } catch (erro) {
        console.error("Erro ao atualizar usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro ao atualizar usuário."
        });
    }
};

const excluir = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        await prisma.usuario.delete({
            where: { id }
        });

        return res.status(200).json({
            mensagem: "Usuário excluído com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao excluir usuário:", erro);

        return res.status(500).json({
            mensagem: "Erro ao excluir usuário."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (
            typeof email !== "string" ||
            typeof senha !== "string" ||
            !email.trim() ||
            !senha
        ) {
            return res.status(400).json({
                mensagem: "Informe o e-mail e a senha."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const usuario = await prisma.usuario.findFirst({
            where: { email: emailNormalizado }
        });

        if (!usuario || senha !== usuario.senha) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            });
        }

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            }
        });
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);

        return res.status(500).json({
            mensagem: "Erro ao realizar login."
        });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir,
    login
};
