/* ================================================================
   audio.js — Áudio do jogo.
   - MÚSICA de fundo: faixa MP3 (assets/audio/Unisuam.mp3) em loop,
     tocada na tela inicial e durante a corrida.
   - EFEITOS sintetizados via Web Audio API: motor contínuo, nitro,
     acerto, erro e chegada.
   Exposto como window.GameAudio.
   ================================================================ */

const GameAudio = (() => {
  let ctx = null;          // AudioContext
  let master = null;       // ganho master (volume geral)
  let musicGain = null;    // ganho da música
  let sfxGain = null;      // ganho de efeitos
  let engine = null;       // nó do motor (osc + filtro)
  let musicTimer = null;   // agendador do sequenciador
  let musicOn = true;
  let started = false;
  let volume = 0.8;

  // -------------------- Inicialização (após gesto do usuário) -----
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.9;
    sfxGain.connect(master);

    ensureMusic(); // pré-carrega a faixa MP3
  }

  function resume() {
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  // -------------------- MÚSICA (faixa MP3 em loop) ----------------
  // Música de fundo do jogo e da tela inicial: assets/audio/Unisuam.mp3.
  let music = null;
  let musicLevel = 0.6; // nível relativo da música (0..1)

  // Cria o elemento de áudio (independe do AudioContext).
  function ensureMusic() {
    if (music) return;
    music = new Audio("assets/audio/Unisuam.mp3");
    music.loop = true;
    music.preload = "auto";
    music.volume = musicLevel * volume;
  }

  // Buffer de ruído branco (usado pelo som de nitro).
  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function startMusic() {
    ensureMusic();
    if (!musicOn || !music) return;
    music.volume = musicLevel * volume;
    const p = music.play();
    if (p && typeof p.catch === "function") p.catch(() => {}); // ignora bloqueio de autoplay
  }

  function stopMusic() {
    if (music) music.pause();
  }

  // -------------------- MOTOR contínuo -----------------------------
  function startEngine() {
    if (!ctx || engine) return;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "sawtooth"; osc2.type = "square";
    osc.frequency.value = 60; osc2.frequency.value = 90;
    filter.type = "lowpass"; filter.frequency.value = 600;
    g.gain.value = 0.0;
    osc.connect(filter); osc2.connect(filter);
    filter.connect(g); g.connect(sfxGain);
    osc.start(); osc2.start();
    engine = { osc, osc2, filter, gain: g };
  }

  // Atualiza tom do motor conforme velocidade (0..1) e nitro.
  function updateEngine(speedRatio, nitro) {
    if (!engine || !ctx) return;
    const base = 55 + speedRatio * 230 + (nitro ? 80 : 0);
    engine.osc.frequency.setTargetAtTime(base, ctx.currentTime, 0.05);
    engine.osc2.frequency.setTargetAtTime(base * 1.5, ctx.currentTime, 0.05);
    engine.filter.frequency.setTargetAtTime(500 + speedRatio * 1800, ctx.currentTime, 0.05);
    engine.gain.gain.setTargetAtTime(0.08 + speedRatio * 0.14, ctx.currentTime, 0.05);
  }

  function stopEngine() {
    if (!engine) return;
    try { engine.osc.stop(); engine.osc2.stop(); } catch (e) {}
    engine = null;
  }

  // -------------------- EFEITOS pontuais ---------------------------
  function beep(freq, dur, type = "sine", gainVal = 0.3, slideTo = null) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(sfxGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function nitroSound() {
    if (!ctx) return;
    // Whoosh: ruído filtrado subindo + slide.
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.6);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(3500, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    src.connect(bp); bp.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + 0.6);
    beep(220, 0.5, "sawtooth", 0.25, 880);
  }

  function correctSound() { beep(523, 0.12, "square", 0.3); setTimeout(() => beep(784, 0.18, "square", 0.3), 110); }
  function wrongSound() { beep(200, 0.25, "sawtooth", 0.3, 90); }
  function finishSound() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.25, "triangle", 0.3), i * 140));
  }

  // -------------------- Controles públicos -------------------------
  function setVolume(v) {
    volume = v;
    if (master) master.gain.value = v;
    if (music) music.volume = musicLevel * v;
  }
  function toggleMusic() {
    musicOn = !musicOn;
    if (musicOn) startMusic(); else stopMusic();
    return musicOn;
  }
  function isMusicOn() { return musicOn; }

  // Liga tudo no início da corrida.
  function startAll() {
    init(); resume();
    started = true;
    startEngine();
    if (musicOn) startMusic();
  }
  function stopAll() {
    stopMusic();
    stopEngine();
  }

  return {
    init, resume, startAll, stopAll,
    startMusic, stopMusic, toggleMusic, isMusicOn,
    startEngine, updateEngine, stopEngine,
    nitroSound, correctSound, wrongSound, finishSound,
    setVolume,
    get context() { return ctx; }
  };
})();

window.GameAudio = GameAudio;
