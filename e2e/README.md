# Testes de segurança no navegador

Dois roteiros com [Playwright](https://playwright.dev) que exercitam o site de verdade. Não entram no `npm test`
porque precisam de navegador, da API no ar e de dependências que o site não usa em produção.

```bash
npm i -D playwright-core           # e um Chromium (npx playwright install chromium, ou CHROMIUM=/caminho/do/chrome)
```

## 1. Fluxo de segurança (site em modo dev)

Sobe a API de teste (na pasta da API), com banco em memória e o MFA do admin obrigatório, e o site apontando para ela.
Os três segredos precisam ser os MESMOS nos dois (gere com `npm run keys` na API):

```bash
# API (porta 4095)
DATABASE_URL= PGLITE_DIR=memory:// INGEST_CADA_MINUTOS=0 PORT=4095 \
ADMIN_EMAIL=chefe@teste.local ADMIN_PASSWORD='Tr0ca-esta-senha-forte-42' \
WEB_ORIGIN=http://localhost:3500 ADMIN_EXIGE_MFA=true \
JWT_PRIVATE_KEY=… JWT_PUBLIC_KEY=… MFA_ENC_KEY=… SENHA_PEPPER=… PROXY_SECRET=… npm start

# site (porta 3500)
API_URL=http://localhost:4095 JWT_PUBLIC_KEY=… PROXY_SECRET=… NEXT_PUBLIC_SITE_URL=http://localhost:3500 npx next dev -p 3500

node e2e/fluxo-seguranca.mjs        # recomece a API a cada execução (ele cadastra contas)
```

## 2. CSP do build de produção

```bash
npx next build && npx next start -p 3501      # mesmas variáveis do site acima
node e2e/csp-producao.mjs
```
