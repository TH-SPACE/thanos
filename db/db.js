const mysql = require('mysql2');
const dotenv = require('dotenv');
const oracledb = require('oracledb');
const chalk = require('chalk');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,       // Endereço do banco (geralmente localhost)
    user: process.env.DB_USER,       // Usuário do banco (ex: root)
    password: process.env.DB_PASSWORD, // Senha do banco
    database: process.env.DB_NAME    // Nome do banco de dados
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err);
    } else {
        console.log(chalk.bgWhite('Conexão com o banco de dados MariaDB estabelecida com sucesso!'));
        connection.release(); // Libera a conexão de volta para o pool
    }
});

// Variável para rastrear se o pool Oracle já foi inicializado
let oracleInitialized = false;
let oracleInitPromise = null;

// Configuração do OracleDB
async function initializeOracle() {
    if (oracleInitialized) {
        return; // Já inicializado
    }

    if (oracleInitPromise) {
        return oracleInitPromise; // Retorna a promessa em andamento
    }

    oracleInitPromise = (async () => {
        try {
            await oracledb.createPool({
                user: process.env.ORACLE_DB_USER,       // Usuário do banco
                password: process.env.ORACLE_DB_PASSWORD, // Senha do banco
                connectString: `${process.env.ORACLE_DB_HOST}/${process.env.ORACLE_DB_NAME}`, // String de conexão (ex: "10.240.47.105/SIGITMSTB")
                poolAlias: 'default' // Adicionando alias explícito para o pool
            });            
            oracleInitialized = true;
            console.log('Conexão com o banco de dados Oracle estabelecida com sucesso!');
        } catch (err) {
            console.error(chalk.red('Erro ao conectar ao banco de dados Oracle, pois não está na Intranet ou erro de login e senha.'));
            // console.error(err);
            oracleInitialized = false;
            throw err; // Lança o erro para ser tratado por quem chama
        }
    })();

    return oracleInitPromise;
}

async function closeOracle() {
    try {
        await oracledb.getPool().close(0);
        console.log('Conexão com o banco de dados Oracle encerrada com sucesso!');
    } catch (err) {
        console.error('Erro ao encerrar a conexão com o banco de dados Oracle:');
    }
}

async function getOracleConnection() {
    try {
        // Garante que o pool Oracle esteja inicializado antes de obter uma conexão
        await initializeOracle();

        return await oracledb.getConnection('default'); // Especificando o pool 'default'
    } catch (err) {
        console.error('Erro ao obter conexão do OracleDB:');
        throw err;
    }
}

// Chama a função para inicializar a conexão com o OracleDB
// Não esperamos por ela aqui para não bloquear a inicialização
initializeOracle().catch(err => {
    // Apenas loga o erro, já que a inicialização pode falhar por motivos de rede/configuração
    console.error('Erro na inicialização do OracleDB (continuando):', err);
});

//module.exports = pool.promise();

module.exports = {
    mysqlPool: pool.promise(),
    initializeOracle,
    closeOracle,
    getOracleConnection
};