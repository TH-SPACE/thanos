# Pasta de Ícones

Contém ícones e favicons do sistema.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `favicon.svg` | Ícone principal da aba do navegador |

## Como Adicionar Novos Ícones

1. Crie o ícone em SVG ou PNG
2. Nomeie de forma descritiva
3. Use no HTML:
   ```html
   <link rel="icon" href="/alerta-b2b/icons/nome-icon.svg">
   ```

## Tamanhos Sugeridos

- **Favicon**: 32x32, 48x48, 64x64
- **Ícones UI**: 16x16, 24x24, 32x32
- **Ícones Grandes**: 48x48, 64x64, 128x128

## Formato SVG (Recomendado)

Vantagens do SVG:
- ✅ Escala sem perder qualidade
- ✅ Arquivo menor
- ✅ Pode mudar cor via CSS
- ✅ Suporte em todos navegadores modernos

Exemplo de SVG:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#2563eb"/>
</svg>
```
