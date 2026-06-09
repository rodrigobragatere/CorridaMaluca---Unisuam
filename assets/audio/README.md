# assets/audio

- **Música de fundo:** `Unisuam.mp3` — tocada em loop na tela inicial e durante
  a corrida (configurada em `js/audio.js`).
- **Efeitos** (motor, nitro, acerto, erro, chegada) continuam **sintetizados em
  tempo real pela Web Audio API**, sem arquivos externos.

Para trocar a música, substitua `Unisuam.mp3` (ou ajuste o caminho em
`js/audio.js`, função `ensureMusic`).
