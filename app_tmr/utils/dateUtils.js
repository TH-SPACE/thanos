/**
 * Utilitários para manipulação de datas
 */

// Função para converter datas do formato Oracle para Date do JavaScript
function parseOracleDate(dateStr) {
    if (!dateStr) return null;

    // Verificar se já é um objeto Date
    if (dateStr instanceof Date) return dateStr;

    // Verificar se é um número (timestamp)
    if (typeof dateStr === 'number') return new Date(dateStr);

    // Converter string do formato DD/MM/YYYY HH24:MI:SS para formato ISO
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/;
    const match = dateStr.match(dateRegex);

    if (match) {
        // Formato: DD/MM/YYYY HH24:MI:SS
        const [, day, month, year, hour, minute, second] = match;
        // Converter para formato ISO: YYYY-MM-DDTHH:mm:ss
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }

    // Se não for o formato esperado, tentar parse direto
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

module.exports = {
    parseOracleDate
};