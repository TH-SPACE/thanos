const xlsx = require('xlsx');

try {
  console.log('Lendo o arquivo BDs.xlsx...');
  const workbook = xlsx.readFile('C:\\sgq-app\\app_b2b\\BDs.xlsx');
  console.log('Sheet names:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  console.log('Usando sheet:', sheetName);
  
  const worksheet = workbook.Sheets[sheetName];
  console.log('Range:', worksheet['!ref']);
  
  // Ler como objeto para ver os cabeçalhos
  const dataAsObject = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  console.log('Primeira linha (cabeçalhos):', dataAsObject[0]);
  console.log('Número de colunas detectadas:', dataAsObject[0].length);
  
  // Mostrar os 5 primeiros registros para ver a estrutura
  console.log('Primeiros 5 registros:');
  for (let i = 0; i < Math.min(5, dataAsObject.length); i++) {
    console.log(`Linha ${i}:`, dataAsObject[i]);
  }
} catch (error) {
  console.error('Erro ao ler o arquivo:', error.message);
}