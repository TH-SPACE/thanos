const mysql = require('mysql2/promise');

// Usando configuração direta do banco
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sgq_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function debugGrupos() {
    try {
        console.log('Conectando ao banco de dados...');
        const connection = await pool.getConnection();
        
        console.log('Verificando se a tabela reparos_b2b_tmr existe e tem dados...');
        
        // Verificar se a tabela existe
        const [tables] = await connection.execute("SHOW TABLES LIKE 'reparos_b2b_tmr'");
        if (tables.length === 0) {
            console.log('ERRO: Tabela reparos_b2b_tmr não existe!');
            connection.release();
            return;
        }
        
        console.log('Tabela reparos_b2b_tmr existe.');
        
        // Verificar quantidade de registros
        const [countResult] = await connection.execute("SELECT COUNT(*) as total FROM reparos_b2b_tmr");
        const totalRegistros = countResult[0].total;
        console.log(`Total de registros na tabela: ${totalRegistros}`);
        
        if (totalRegistros === 0) {
            console.log('AVISO: Tabela está vazia!');
            connection.release();
            return;
        }
        
        // Verificar se tem dados nos últimos 3 meses
        const dataAtual = new Date();
        const primeiroDiaTresMesesAtras = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 2, 1);
        const dataInicioStr = primeiroDiaTresMesesAtras.toISOString().split('T')[0];
        
        console.log(`Verificando dados a partir de: ${dataInicioStr}`);
        
        const [recentData] = await connection.execute(
            "SELECT COUNT(*) as total FROM reparos_b2b_tmr WHERE tqi_abertura >= ?",
            [dataInicioStr]
        );
        
        console.log(`Registros nos últimos 3 meses: ${recentData[0].total}`);
        
        if (recentData[0].total === 0) {
            console.log('AVISO: Não há dados nos últimos 3 meses!');
        } else {
            // Mostrar uma amostra dos dados
            const [sampleData] = await connection.execute(
                "SELECT grp_nome, tqi_abertura, tmr_total FROM reparos_b2b_tmr WHERE tqi_abertura >= ? LIMIT 5",
                [dataInicioStr]
            );
            
            console.log('Amostra dos dados recentes:');
            sampleData.forEach((row, index) => {
                console.log(`${index + 1}. Grupo: ${row.grp_nome}, Abertura: ${row.tqi_abertura}, TMR: ${row.tmr_total}`);
            });
        }
        
        connection.release();
        console.log('Conexão liberada com sucesso.');
    } catch (error) {
        console.error('Erro durante o debug:', error);
    }
}

debugGrupos();