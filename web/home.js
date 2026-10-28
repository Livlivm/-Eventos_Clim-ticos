
const API_URL = "http://localhost:3001";

let usuario;

try {
    usuario = JSON.parse(localStorage.getItem("usuario") || "null");
} catch {
    usuario = null;
}

if (!usuario) {
    window.location.replace("index.html");
}

let eventos = [];
let eventoEditando = null;

const container = document.getElementById("eventosContainer");
const mensagemEventos = document.getElementById("mensagemEventos");
const mensagemFormulario = document.getElementById("mensagemFormulario");
const modal = document.getElementById("modalEvento");
const formulario = document.getElementById("formEvento");

document.getElementById("nomeUsuario").textContent = usuario?.nome || "Usuário";
document.getElementById("nomeBoasVindas").textContent =
    usuario?.nome?.split(" ")[0] || "tudo bem?";
document.getElementById("avatarUsuario").textContent =
    usuario?.nome?.charAt(0).toUpperCase() || "U";

function mostrarMensagem(elemento, texto, tipo = "") {
    elemento.textContent = texto;
    elemento.className = `message ${tipo}`;
}

async function lerResposta(resposta) {
    const texto = await resposta.text();

    let resultado;

    try {
        resultado = texto ? JSON.parse(texto) : null;
    } catch {
        resultado = null;
    }

    if (!resposta.ok) {
        throw new Error(
            resultado?.mensagem ||
            resultado?.erro ||
            texto ||
            `Erro HTTP ${resposta.status}`
        );
    }

    return resultado;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function formatarData(data) {
    if (!data) return "Data não informada";

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) return "Data não informada";

    return valor.toLocaleDateString("pt-BR", {
        timeZone: "UTC"
    });
}

function classeImpacto(impacto) {
    return String(impacto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function iconeEvento(tipo) {
    const valor = String(tipo || "").toLowerCase();

    if (valor.includes("tempestade") || valor.includes("chuva")) {
        return "fa-cloud-bolt";
    }

    if (
        valor.includes("queimada") ||
        valor.includes("incêndio") ||
        valor.includes("incendio")
    ) {
        return "fa-fire";
    }

    if (valor.includes("geada") || valor.includes("frio")) {
        return "fa-snowflake";
    }

    if (valor.includes("seca")) {
        return "fa-sun";
    }

    if (
        valor.includes("enchente") ||
        valor.includes("inundação") ||
        valor.includes("inundacao")
    ) {
        return "fa-water";
    }

    return "fa-cloud";
}

async function carregarEventos() {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <h3>Carregando eventos...</h3>
            <p>Buscando os registros no banco de dados.</p>
        </div>
    `;

    try {
        const resposta = await fetch(`${API_URL}/evento/listar`);
        const resultado = await lerResposta(resposta);

        eventos = Array.isArray(resultado)
            ? resultado
            : Array.isArray(resultado?.eventos)
                ? resultado.eventos
                : [];

        if (!Array.isArray(resultado) && !Array.isArray(resultado?.eventos)) {
            throw new Error("A API não retornou uma lista de eventos.");
        }

        atualizarIndicadores();
        renderizarEventos();
        mensagemEventos.textContent = "";
    } catch (erro) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Não foi possível carregar os eventos</h3>
                <p>${escaparHTML(erro.message)}</p>
            </div>
        `;
    }
}

function atualizarIndicadores() {
    document.getElementById("totalEventos").textContent = eventos.length;

    const cidades = new Set(
        eventos
            .map(item => String(item.cidade || "").trim().toLowerCase())
            .filter(Boolean)
    );

    document.getElementById("totalCidades").textContent = cidades.size;

    document.getElementById("totalImpacto").textContent = eventos.filter(item => {
        const impacto = classeImpacto(item.nivelImpacto);
        return impacto === "alto" || impacto === "critico";
    }).length;
}

function renderizarEventos() {
    const pesquisa = document
        .getElementById("pesquisaEvento")
        .value.trim()
        .toLowerCase();

    const filtrados = eventos.filter(item =>
        String(item.cidade || "").toLowerCase().includes(pesquisa) ||
        String(item.tipoEvento || "").toLowerCase().includes(pesquisa)
    );

    if (!filtrados.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-cloud"></i>
                <h3>${pesquisa ? "Nenhum evento encontrado" : "Nenhum evento cadastrado"}</h3>
                <p>${pesquisa
                    ? "Tente pesquisar por outra cidade ou tipo."
                    : "Cadastre seu primeiro evento climático para começar."}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtrados.map(item => {
        const id = Number(item.id);
        const impacto = escaparHTML(item.nivelImpacto || "Não informado");
        const classe = classeImpacto(item.nivelImpacto);

        const temperatura =
            item.temperaturaMaxima === null ||
            item.temperaturaMaxima === undefined ||
            item.temperaturaMaxima === ""
                ? "Temperatura não informada"
                : `${escaparHTML(item.temperaturaMaxima)} °C`;

        return `
            <article class="event-card">
                <div class="event-icon">
                    <i class="fa-solid ${iconeEvento(item.tipoEvento)}"></i>
                </div>

                <div class="event-main">
                    <h3>${escaparHTML(item.cidade)}, ${escaparHTML(item.tipoEvento)}</h3>

                    <div class="event-meta">
                        <span>
                            <i class="fa-regular fa-calendar"></i>
                            ${formatarData(item.data)}
                        </span>

                        <span>
                            <i class="fa-solid fa-temperature-half"></i>
                            ${temperatura}
                        </span>
                    </div>
                </div>

                <span class="impact-badge ${classe}">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    ${impacto}
                </span>

                <div class="event-actions">
                    <button
                        class="action-button"
                        data-acao="editar"
                        data-id="${id}"
                        title="Editar"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        class="action-button delete"
                        data-acao="excluir"
                        data-id="${id}"
                        title="Excluir"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function abrirModal(item = null) {
    eventoEditando = item ? Number(item.id) : null;
    formulario.reset();

    mensagemFormulario.textContent = "";
    mensagemFormulario.className = "message";

    document.getElementById("tituloModal").textContent =
        item ? "Editar evento" : "Novo evento";

    document.getElementById("btnSalvarEvento").innerHTML =
        item
            ? '<i class="fa-solid fa-check"></i> Salvar alterações'
            : '<i class="fa-solid fa-check"></i> Salvar evento';

    if (item) {
        document.getElementById("cidade").value = item.cidade || "";
        document.getElementById("tipoEvento").value = item.tipoEvento || "";
        document.getElementById("temperaturaMaxima").value =
            item.temperaturaMaxima ?? "";
        document.getElementById("nivelImpacto").value =
            item.nivelImpacto || "";
        document.getElementById("dataEvento").value = item.data
            ? String(item.data).slice(0, 10)
            : "";
    } else {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");

        document.getElementById("dataEvento").value =
            `${ano}-${mes}-${dia}`;
    }

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function fecharModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    eventoEditando = null;
    formulario.reset();
}

async function salvarEvento(event) {
    event.preventDefault();

    const botao = document.getElementById("btnSalvarEvento");
    botao.disabled = true;

    const data = {
        cidade: document.getElementById("cidade").value.trim(),
        tipoEvento: document.getElementById("tipoEvento").value.trim(),
        data: new Date(
            `${document.getElementById("dataEvento").value}T12:00:00.000Z`
        ).toISOString(),
        nivelImpacto: document.getElementById("nivelImpacto").value,
        temperaturaMaxima:
            document.getElementById("temperaturaMaxima").value === ""
                ? null
                : Number(
                    document.getElementById("temperaturaMaxima").value
                )
    };

    if (!eventoEditando) {
        if (!usuario?.id) {
            mostrarMensagem(
                mensagemFormulario,
                "Não encontrei o ID do usuário. Confira os dados retornados no login.",
                "error"
            );

            botao.disabled = false;
            return;
        }

        data.usuarioId = Number(usuario.id);
    }

    try {
        const url = eventoEditando
            ? `${API_URL}/evento/atualizar/${eventoEditando}`
            : `${API_URL}/evento/cadastrar`;

        const resposta = await fetch(url, {
            method: eventoEditando ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        await lerResposta(resposta);

        const estavaEditando = Boolean(eventoEditando);

        fecharModal();
        await carregarEventos();

        mostrarMensagem(
            mensagemEventos,
            estavaEditando
                ? "Evento atualizado com sucesso!"
                : "Evento cadastrado com sucesso!",
            "success"
        );
    } catch (erro) {
        mostrarMensagem(mensagemFormulario, erro.message, "error");
    } finally {
        botao.disabled = false;
    }
}

async function excluirEvento(id) {
    const item = eventos.find(evento => Number(evento.id) === id);

    if (!item) return;

    if (!confirm(`Deseja excluir "${item.cidade} — ${item.tipoEvento}"?`)) {
        return;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/evento/excluir/${id}`,
            {
                method: "DELETE"
            }
        );

        await lerResposta(resposta);
        await carregarEventos();

        mostrarMensagem(
            mensagemEventos,
            "Evento excluído com sucesso!",
            "success"
        );
    } catch (erro) {
        mostrarMensagem(mensagemEventos, erro.message, "error");
    }
}

document.getElementById("btnNovoTopo").addEventListener("click", () => {
    abrirModal();
});

document.getElementById("btnNovoBanner").addEventListener("click", () => {
    abrirModal();
});

document.getElementById("btnNovoLista").addEventListener("click", () => {
    abrirModal();
});

document.getElementById("btnFecharModal").addEventListener("click", fecharModal);
document.getElementById("btnCancelarModal").addEventListener("click", fecharModal);
document.getElementById("btnAtualizarLista").addEventListener("click", carregarEventos);

document.getElementById("pesquisaEvento").addEventListener("input", renderizarEventos);

formulario.addEventListener("submit", salvarEvento);

container.addEventListener("click", event => {
    const botao = event.target.closest("button[data-acao]");

    if (!botao) return;

    const id = Number(botao.dataset.id);
    const item = eventos.find(evento => Number(evento.id) === id);

    if (botao.dataset.acao === "editar" && item) {
        abrirModal(item);
    }

    if (botao.dataset.acao === "excluir") {
        excluirEvento(id);
    }
});

document.getElementById("btnSair").addEventListener("click", () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    window.location.href = "index.html";
});

modal.addEventListener("click", event => {
    if (event.target === modal) {
        fecharModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        fecharModal();
    }
});

if (usuario) {
    carregarEventos();
}
