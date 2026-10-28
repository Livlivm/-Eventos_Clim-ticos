
const API_URL = "http://localhost:3001";

const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagemLogin");
const botaoEntrar = document.getElementById("btnEntrar");
const senha = document.getElementById("senha");

document.getElementById("togglePassword").addEventListener("click", function () {
    const mostrar = senha.type === "password";

    senha.type = mostrar ? "text" : "password";

    this.innerHTML = mostrar
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
});

formLogin.addEventListener("submit", async function (event) {
    event.preventDefault();

    mensagem.textContent = "";
    mensagem.className = "message";

    botaoEntrar.disabled = true;
    botaoEntrar.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';

    try {
        const resposta = await fetch(`${API_URL}/usuario/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: document.getElementById("email").value.trim(),
                senha: senha.value
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem ||
                resultado.erro ||
                "Não foi possível fazer login."
            );
        }

        if (!resultado.usuario) {
            throw new Error("A API não retornou os dados do usuário.");
        }

        localStorage.setItem(
            "usuario",
            JSON.stringify(resultado.usuario)
        );

        localStorage.setItem(
            "nomeUsuario",
            resultado.usuario.nome
        );

        localStorage.setItem(
            "nome",
            resultado.usuario.nome
        );

        if (resultado.token) {
            localStorage.setItem("token", resultado.token);
        }

        window.location.href = "home.html";

    } catch (erro) {
        console.error("Erro no login:", erro);

        mensagem.textContent =
            erro.message === "Failed to fetch"
                ? "Não foi possível conectar à API. Confira se o servidor está funcionando."
                : erro.message;

        mensagem.className = "message error";

    } finally {
        botaoEntrar.disabled = false;

        botaoEntrar.innerHTML =
            'Entrar na plataforma <i class="fa-solid fa-arrow-right"></i>';
    }
});
