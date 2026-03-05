# 📁 Estrutura da Pasta Public

Esta pasta contém todos os arquivos estáticos da aplicação Alerta B2B.

## 🗂️ Organização

```
public/
├── index.html              # Página principal
├── css/
│   └── style.css           # Folha de estilos principal
├── js/
│   └── app.js              # JavaScript da aplicação
├── img/
│   └── (imagens do sistema)
└── icons/
    └── favicon.png         # Ícone da aba do navegador
```

## 📄 Descrição dos Arquivos

### HTML
| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Página principal com dashboard, filtros e tabela |

### CSS
| Arquivo | Descrição |
|---------|-----------|
| `style.css` | Estilos de toda a aplicação (cores, layout, responsividade) |

### JavaScript
| Arquivo | Descrição |
|---------|-----------|
| `app.js` | Lógica frontend (busca dados, filtros, paginação, modal) |

### Imagens
| Pasta | Descrição |
|-------|-----------|
| `img/` | Imagens do sistema, logos, screenshots |
| `icons/` | Ícones e favicons |

## 🎨 Estrutura do CSS

O arquivo `style.css` está organizado em seções:

1. **Variáveis CSS** - Cores e temas
2. **Reset e Global** - Margin, padding, font-family
3. **Container** - Layout principal
4. **Cabeçalho** - Header e logo
5. **Botões** - Estilos de botões
6. **Cards de Estatísticas** - Dashboard
7. **Filtros** - Seção de filtros
8. **Tabela** - Tabela de dados
9. **Paginação** - Controles de página
10. **Modal** - Janela de detalhes
11. **Loading** - Animações de carregamento
12. **Mensagens** - Alertas e notificações
13. **Responsivo** - Media queries

## ⚡ Estrutura do JavaScript

O arquivo `app.js` contém as seguintes funções:

### Inicialização
- `DOMContentLoaded` - Inicializa a aplicação

### Sincronização
- `sincronizarDados()` - Faz POST para sincronizar

### Carregamento de Dados
- `carregarEstatisticas()` - Busca stats do backend
- `carregarDados()` - Busca registros da tabela
- `coletarFiltros()` - Pega valores dos filtros
- `limparFiltros()` - Reseta todos os filtros

### Renderização
- `criarLinhaTabela()` - Cria tr da tabela
- `mostrarDetalhes()` - Abre modal com detalhes
- `criarDetalheItem()` - Cria item do modal
- `renderizarPaginacao()` - Cria botões de página
- `atualizarInfoTabela()` - Atualiza contador

### Utilitários
- `formatarNumero()` - Formata números (pt-BR)
- `formatarCNPJ()` - Formata CNPJ
- `formatarSLA()` - Formata horas de SLA
- `formatarPrazo()` - Formata dias de prazo
- `formatarData()` - Formata datas (pt-BR)
- `mostrarMensagem()` - Exibe alertas

## 🖼️ Como Adicionar Imagens

1. Coloque o arquivo na pasta `img/` ou `icons/`
2. Use o caminho correto no HTML/JS:
   ```html
   <img src="/alerta-b2b/img/minha-imagem.png" alt="Descrição">
   ```

## 🎯 Melhores Práticas

- **CSS**: Mantenha o style.css organizado por seções
- **JS**: Funções com nomes descritivos em português
- **Img**: Use nomes sem espaços e em minúsculas
- **Icons**: Use formatos PNG ou SVG para ícones

## 📏 Padrões de Nomenclatura

- **Arquivos**: `kebab-case` (ex: `style.css`, `app.js`)
- **Variáveis JS**: `camelCase` (ex: `estadoAtual`)
- **Funções JS**: `camelCase` (ex: `carregarDados()`)
- **Classes CSS**: `kebab-case` (ex: `.stat-card`)
- **IDs HTML**: `camelCase` (ex: `btnSincronizar`)

---

**Atualizado:** 2026-03-05  
**Projeto:** Alerta B2B
