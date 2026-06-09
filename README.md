# Tech Formula Race 🏎️⚡

Jogo de corrida estilo **Fórmula 1 futurista / cyberpunk** feito em
**HTML5 + CSS3 + JavaScript puro (Vanilla JS)** usando a **Canvas API**.
Sem dependências externas, sem build — basta abrir no navegador.

## ▶️ Como jogar

Por causa das políticas de segurança dos navegadores (módulos/áudio), o ideal é
servir os arquivos por um servidor local simples:

```bash
# Opção 1 — Python
python -m http.server 8000
# depois abra http://localhost:8000

# Opção 2 — Node (npx)
npx serve .
```

Você também pode simplesmente abrir o `index.html` direto no navegador
(file://) — o jogo funciona, mas alguns navegadores restringem o áudio até o
primeiro clique/toque.

## 🎮 Controles

**Desktop**
- ↑ acelerar · ↓ frear/ré · ← virar à esquerda · → virar à direita
- `Espaço` ativa o Nitro (quando disponível)
- `F` tela cheia · `M` liga/desliga música

**Mobile**
- Joystick virtual (canto inferior esquerdo)
- Botão **NITRO** (canto inferior direito)

## 🧠 Mecânicas

- Corrida de **5 minutos** contra **9 adversários com IA** (10 no total).
- Sistema de **voltas**, **posição em tempo real** e **cronômetro regressivo**.
- A cada **30 segundos** o jogo pausa e exibe uma **pergunta de HTML**
  (banco com 60+ perguntas, sorteio sem repetição).
  - **Acertou:** Nitro liberado (10s de velocidade extra + efeitos de turbo).
  - **Errou:** velocidade reduzida em 30% por 10s.
- **Pontuação** por voltas, ultrapassagens, acertos, tempo em 1º e uso do nitro.
- **Ranking TOP 10** salvo via **LocalStorage** (ordenado por posição e tempo).

## 📁 Estrutura

```
/index.html
/vercel.json          -> configuração de deploy na Vercel
/api/ranking.js       -> Vercel Serverless Function (ranking global)
/css/style.css
/js/game.js           -> loop, pista, câmera, render, partículas, HUD, estados
/js/player.js         -> física do carro + jogador
/js/ai.js             -> adversários com IA
/js/questions.js      -> banco de perguntas (60+) sobre HTML
/js/audio.js          -> áudio sintetizado (Web Audio API)
/js/ranking.js        -> ranking híbrido (API serverless + LocalStorage)
/assets/images        -> logo UNISUAM (visual do jogo é desenhado via Canvas)
/assets/audio         -> (opcional; áudio é sintetizado)
```

## ☁️ Deploy na Web (Vercel + Serverless Functions)

O ranking agora é **global** graças a uma **Vercel Function** em
`/api/ranking.js` (`GET` lê o TOP 10, `POST` envia um resultado, `DELETE`
limpa). O cliente mantém um **espelho em LocalStorage**, então o jogo continua
funcionando offline ou em `file://` mesmo sem a API.

### Passos

1. Instale a CLI e faça login: `npm i -g vercel && vercel login`
2. Na pasta do projeto, rode `vercel` (deploy de preview) ou `vercel --prod`.
   - É um projeto **estático + serverless** (sem build/framework). A Vercel
     serve os arquivos da raiz e detecta automaticamente a pasta `/api`.
3. Pronto: o jogo abre na URL gerada e o ranking funciona online.

### Persistência do ranking (recomendado)

A função usa **Vercel KV / Upstash Redis** quando configurado:

1. No painel da Vercel: **Storage → Create → KV (Upstash)** e conecte ao projeto.
   Isso injeta as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
2. Refaça o deploy. Agora o TOP 10 persiste de verdade entre acessos.

> Sem KV configurado, a função usa armazenamento **em memória** (some a cada
> "cold start") — ótimo para testar, mas use o KV para um ranking permanente.

### Rodando a API localmente

`vercel dev` sobe o site + as funções em `http://localhost:3000` (útil para
testar o `/api/ranking`). Servidores estáticos simples (ex.: `python -m
http.server`) **não** executam a função — nesse caso o jogo usa o ranking local.

## ✨ Extras incluídos

Sistema de partículas, chuva de bits (0/1), placas holográficas, circuitos
neon nas laterais, efeitos de velocidade, iluminação dinâmica, modo tela cheia,
botão reiniciar, botão de música e persistência do ranking.
