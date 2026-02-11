// 🌐 Módulos Principais
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
const { version } = require("./package.json");
const multer = require("multer");

// 🔐 Middlewares
const {
  verificaLogin,
  verificaADM,
  verificaUSER,
} = require("./middlewares/autenticacao");
const { logMiddleware } = require("./middlewares/log");

// ⚙️ Inicializações
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do app
app.set("trust proxy", true);

app.use(express.json());

// 📁 Arquivos estáticos públicos
app.use(express.static(path.join(__dirname, "public")));
app.use("/json", express.static(path.join(__dirname, "app_he", "json")));
app.use("/public", express.static(path.join(__dirname, "app_he", "public")));
// Serve a pasta app_thanos para arquivos estáticos do ThanOS
app.use(
  "/thanos",
  express.static(path.join(__dirname, "app_thanos", "public"))
);
// Serve a pasta app_tmr para arquivos estáticos do TMR
app.use("/tmr", express.static(path.join(__dirname, "app_tmr", "public")));
// Serve a pasta app_mapa para arquivos estáticos do Mapa
app.use("/mapab2b", express.static(path.join(__dirname, "app_mapa", "public")));
// Serve a pasta consulta_ad como estática para o script.js
app.use("/consulta_ad", express.static(path.join(__dirname, "consulta_ad")));
// Serve a pasta app_b2b para arquivos estáticos do B2B
app.use("/b2b", express.static(path.join(__dirname, "app_b2b", "public")));

// 📦 Middlewares globais
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "segredo123",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 * 365 }, // 1 ano (login permanente)
  })
);

// ✅ Middleware de log personalizado
app.use(logMiddleware);

// 🧭 Rotas públicas
app.use("/", require("./routes/public"));

// 🧭 Rotas protegidas
app.use("/auth", require("./routes/auth"));
app.use("/thanos", require("./app_thanos/routes/thanosRoutes"));
app.use("/admin", require("./admin_app/routes/adminRoutes"));
app.use("/consulta-ad", require("./consulta_ad/consulta_route"));

// 🎯 Rotas específicas
app.use("/planejamento-he", require("./app_he/routes/planejamentoHERoutes"));
app.use("/tmr", require("./app_tmr/routes/tmrRoutes"));
app.use("/mapab2b", require("./app_mapa/routes/mapaRoutes"));
app.use("/b2b", require("./app_b2b/routes/b2bRoutes"));

// 📋 Rota da todo list
app.use("/todo_th", require("./todo_th/todo_th"));

// Inicializar o serviço de sincronização do TMR
require("./app_tmr/initTmrSync");

// 🚀 Inicialização do servidor
app.listen(PORT, "0.0.0.0", () => {
  // Mensagem formatada de inicialização
  const startupMessage = `
╔══════════════════════════════════════════════════════════════╗
║                    THANOS INICIADO COM SUCESSO!              ║
║                                                              ║
║  🔥 Aplicação rodando em: http://10.243.20.64:${PORT}          ║
║  📦 Versão: v${version.padEnd(47 - version.length, " ")}     ║
║  ⏰ Serviço TMR: Sincronização automática ativa              ║
║  🔄 Atualizações a cada 12 horas                             ║
║                                                              ║
║  Sistema pronto para uso!                                    ║
╚══════════════════════════════════════════════════════════════╝
`;

  console.log(startupMessage);
});
