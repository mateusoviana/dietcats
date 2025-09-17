# DietCats

Guia de onboarding e desenvolvimento para o time.

Repositório: [github.com/mateusoviana/dietcats](https://github.com/mateusoviana/dietcats)

## Sumário
- Requisitos
- Setup rápido
- Scripts úteis
- Convenções
- Estrutura do projeto
- Troubleshooting
- Documentação do produto

## Requisitos
- Node LTS (>= 18)
- Android Studio (para emulador) ou dispositivo físico com Expo Go

## Setup rápido
```bash
git clone https://github.com/mateusoviana/dietcats.git
cd dietcats
npm install
npx expo start
```

Para abrir:
- Android: pressione `a` no terminal (emulador aberto) ou escaneie o QR no Expo Go.
- Web: `w`.

## Scripts úteis
```bash
npm run start        # inicia o Expo
npm run android      # abre no Android
npm run ios          # abre no iOS (macOS)
npm run web          # abre no web
npx tsc --noEmit     # checagem de tipos
```

## Convenções
- TypeScript strict, `jsx: react-jsx`, `esModuleInterop: true`.
- Pastas com aliases: `@/components`, `@/screens`, `@/services`, etc.
- Commits: Conventional Commits (ex.: feat, fix, chore).

## Estrutura do projeto
```
src/
  components/
  contexts/
  navigation/
  screens/
  services/
  types/
```

## Troubleshooting
- Dependências desalinhadas: `npx expo install --fix`
- Limpar cache: `npx expo start -c`
- Erros de JSX/esModuleInterop: garantir `tsconfig.json` com `jsx: react-jsx` e `esModuleInterop: true`.

## Documentação do produto
- Visão geral, escopo e requisitos: veja `docs/VISAO_GERAL.md`.