/* =========================================================
   NOSSO PROJETO 3D — medicao.js
   Medição de uso com Google Analytics 4, com aviso de cookies.

   - Só carrega o Google depois que a pessoa clica em "Aceitar".
   - A escolha fica salva no navegador e vale para todos os projetos
     do domínio nossoprojeto3d.com.br.
   - Quem usa "Não rastrear" no navegador não é medido nem vê o aviso.
   - Nunca enviamos preços, valores de orçamento, nomes de arquivo nem
     endereços completos. Só nomes de eventos e rótulos curtos (a busca
     do catálogo envia o termo pesquisado).

   Como usar em uma página: <script src="medicao.js" defer></script>
   O aviso de cookies é claro por padrão e escuro em páginas com data-theme="dark".
   Cada projeto pode pôr a sua cor com as variáveis --np3d-aviso-acento e
   --np3d-aviso-sobre-acento (e, se quiser, -fundo, -texto, -suave, -borda) no :root.
   Para medir algo específico, chame np3dTrack("nome_do_evento", { chave: "valor" }).
   Qualquer link com data-evento="nome" também vira evento ao clicar
   (parâmetros extras em data-produto, data-categoria etc.).

   Este arquivo é o mesmo em todos os projetos. Se mudar aqui, copie
   para os outros.
   ========================================================= */
(function () {
  "use strict";

  var GA_ID = "G-PNRZ6JQWLP";
  var KEY = "nossoprojeto3d-medicao";
  var HOSTS_PROJETOS = ["nossoprojeto3d.com.br"];

  var ativo = false;
  // Só mede no site oficial: testes no computador (localhost) e links temporários não entram nos números.
  var siteOficial = /(^|\.)nossoprojeto3d\.com\.br$/.test(location.hostname);
  var naoRastrear = navigator.doNotTrack === "1" || !siteOficial;

  /* ---------- consentimento ---------- */
  function lerEscolha() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "granted" || v === "denied" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function salvarEscolha(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch (e) {
      /* sem armazenamento: a escolha vale só nesta visita */
    }
  }

  /* ---------- Google Analytics ---------- */
  function iniciarGoogle() {
    if (ativo) return;
    ativo = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
    observarSecoes();
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function limpar(valor) {
    return String(valor == null ? "" : valor).replace(/\s+/g, " ").trim().slice(0, 80);
  }

  window.np3dTrack = function (evento, params) {
    if (!ativo || typeof window.gtag !== "function") return;
    var p = {};
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) {
          var v = params[k];
          p[k] = typeof v === "number" || typeof v === "boolean" ? v : limpar(v);
        }
      }
    }
    window.gtag("event", evento, p);
  };

  /* ---------- seções vistas (só em páginas com data-medir-secoes no body) ---------- */
  function observarSecoes() {
    function iniciar() {
      if (!document.body.hasAttribute("data-medir-secoes") || !("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting) {
              io.unobserve(e.target);
              window.np3dTrack("ver_secao", { secao: e.target.id, pagina: projetoDaPagina() });
            }
          });
        },
        { threshold: 0.4 }
      );
      document.querySelectorAll("section[id]").forEach(function (s) {
        io.observe(s);
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
  }

  /* ---------- cliques em links ---------- */
  function projetoDaPagina() {
    return location.pathname.split("/").filter(Boolean)[0] || "home";
  }

  function classificar(a) {
    var url;
    try {
      url = new URL(a.href, location.href);
    } catch (e) {
      return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    var host = url.hostname.replace(/^www\./, "");

    if (host === "wa.me" || host === "api.whatsapp.com") return { evento: "clique_whatsapp" };
    if (host === "instagram.com") return { evento: "clique_instagram" };
    if (host === "shopee.com.br") return { evento: "clique_shopee" };
    if (host === "drive.google.com") return { evento: "clique_drive" };
    if (host === "github.com") return { evento: "clique_github" };

    if (HOSTS_PROJETOS.indexOf(host) !== -1) {
      var destino = url.pathname.split("/").filter(Boolean)[0] || "home";
      if (destino === projetoDaPagina() && url.pathname === location.pathname) return null;
      return { evento: "clique_projeto", params: { projeto: destino } };
    }
    if (host !== location.hostname) return { evento: "clique_externo", params: { destino: host } };
    return null;
  }

  function aoClicar(ev) {
    if (!ativo) return;
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;

    var nome = a.getAttribute("data-evento");
    var params = {};
    var d = a.dataset || {};

    if (nome) {
      for (var k in d) {
        if (k !== "evento" && k !== "link") params[k] = d[k];
      }
    } else {
      var c = classificar(a);
      if (!c) return;
      nome = c.evento;
      params = c.params || {};
    }

    var secao = a.closest("[id]");
    params.local = d.link || (secao && secao.id) || "pagina";
    params.pagina = projetoDaPagina();
    window.np3dTrack(nome, params);
  }

  /* ---------- aviso de cookies ---------- */
  function mostrarAviso() {
    if (document.getElementById("np3d-cookies")) return;

    var css = document.createElement("style");
    css.textContent =
      "#np3d-cookies{position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;" +
      "max-width:520px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 14px;" +
      "background:var(--np3d-aviso-fundo,#fff);color:var(--np3d-aviso-texto,#1f1c14);border:1px solid var(--np3d-aviso-borda,#e8e2d0);" +
      "border-radius:12px;box-shadow:0 10px 30px rgba(31,28,20,.18);" +
      "font:12.5px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
      "#np3d-cookies p{margin:0;flex:1 1 auto;color:var(--np3d-aviso-suave,#5c574a)}" +
      "#np3d-cookies div{display:flex;gap:6px;flex:0 0 auto}" +
      "#np3d-cookies button{font:inherit;font-weight:600;cursor:pointer;border-radius:8px;padding:0 12px;min-height:34px;" +
      "border:1px solid var(--np3d-aviso-borda,#e8e2d0);background:transparent;color:var(--np3d-aviso-texto,#1f1c14)}" +
      "#np3d-cookies button[data-acao=aceitar]{background:var(--np3d-aviso-acento,#c9a227);border-color:var(--np3d-aviso-acento,#c9a227);color:var(--np3d-aviso-sobre-acento,#151005)}" +
      "#np3d-cookies button:hover{filter:brightness(1.06)}" +
      "#np3d-cookies button:focus-visible{outline:3px solid var(--np3d-aviso-acento,#c9a227);outline-offset:2px}" +
      // página escura (data-theme="dark", como na calculadora): aviso escuro
      "[data-theme=dark] #np3d-cookies{background:var(--np3d-aviso-fundo,#17150f);color:var(--np3d-aviso-texto,#f4efe3);" +
      "border-color:var(--np3d-aviso-borda,#3a3226);box-shadow:0 10px 30px rgba(0,0,0,.45)}" +
      "[data-theme=dark] #np3d-cookies p{color:var(--np3d-aviso-suave,#a69c87)}" +
      "[data-theme=dark] #np3d-cookies button{border-color:var(--np3d-aviso-borda,#3a3226);color:var(--np3d-aviso-texto,#f4efe3)}" +
      "[data-theme=dark] #np3d-cookies button[data-acao=aceitar]{color:var(--np3d-aviso-sobre-acento,#151005)}";
    document.head.appendChild(css);

    var box = document.createElement("div");
    box.id = "np3d-cookies";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Aviso de cookies");
    box.innerHTML =
      "<p>Usamos cookies para medir as visitas.</p>" +
      '<div><button type="button" data-acao="recusar">Recusar</button>' +
      '<button type="button" data-acao="aceitar">Aceitar</button></div>';

    box.addEventListener("click", function (ev) {
      var acao = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-acao");
      if (!acao) return;
      salvarEscolha(acao === "aceitar" ? "granted" : "denied");
      if (acao === "aceitar") iniciarGoogle();
      box.remove();
      css.remove();
    });

    document.body.appendChild(box);
  }

  /* ---------- início ---------- */
  if (naoRastrear) return;

  document.addEventListener("click", aoClicar, true);

  var escolha = lerEscolha();
  if (escolha === "granted") {
    iniciarGoogle();
  } else if (escolha === null) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mostrarAviso);
    else mostrarAviso();
  }
})();
