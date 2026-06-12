/* ================================================================
   game.js — Núcleo do jogo Tech Formula Race.
   Responsável por: pista, câmera, loop principal, estados, input
   (teclado + touch), corrida (voltas/posições/tempo), perguntas,
   nitro, pontuação, partículas, HUD, telas e ranking.
   Depende de: questions.js, audio.js, ranking.js, player.js, ai.js
   ================================================================ */

(() => {
  "use strict";

  /* ==============================================================
     CONFIGURAÇÃO DA CORRIDA
     ============================================================== */
  const CONFIG = {
    duration: 300,        // 5 minutos (segundos)
    totalLaps: 8,         // voltas alvo
    questionInterval: 30, // pergunta a cada 30s
    questionTime: 15,     // tempo para responder
    nitroDuration: 10,    // segundos de nitro
    penaltyDuration: 10,  // segundos de penalidade
    numOpponents: 9,      // 9 IAs + jogador = 10
    startCountdown: 3     // contagem 3,2,1
  };

  const CAR_COLORS = [
    "#00f0ff", "#ff00d4", "#19ff8a", "#ffe600", "#ff6a00",
    "#7a5cff", "#ff2e63", "#00d0a0", "#ff9ff3", "#54a0ff"
  ];

  const AI_NAMES = [
    "Rodrigo Braga", "Ana Silva", "Carlos Lima", "Bit Runner",
    "Neo Vega", "Luna Code", "Max Byte", "Zara Volt", "Kai Pulse",
    "Echo Dash", "Nova Race", "Cyber Joe"
  ];

  /* ==============================================================
     ESTADO GLOBAL DO JOGO
     ============================================================== */
  const Game = {
    state: "start",     // start | countdown | racing | question | finished
    canvas: null, ctx: null,
    view: { w: 0, h: 0 }, dpr: 1, zoom: 1,
    cars: [], player: null,
    track: null,
    elapsed: 0,         // tempo de corrida decorrido (só avança em "racing")
    lastQuestionAt: 0,
    countdown: 0,
    score: 0,
    correctCount: 0,
    firstPlaceTime: 0,
    lastPlayerPos: 1,
    particles: [],
    worldBits: [],
    speedTrails: [],
    raf: null,
    lastT: 0
  };

  /* ==============================================================
     INPUT (teclado + touch)
     ============================================================== */
  const Input = {
    keys: { up: false, down: false, left: false, right: false },
    analog: { active: false, steer: 0, throttle: 0 },
    nitroPressed: false,

    init() {
      window.addEventListener("keydown", (e) => this.onKey(e, true));
      window.addEventListener("keyup", (e) => this.onKey(e, false));
    },
    onKey(e, down) {
      // Não interceptar quando o usuário está digitando em um campo
      // (ex.: nome do piloto) — libera o teclado inteiro, inclusive A/W/S/D.
      const el = e.target;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        return;
      }

      // Durante a pergunta, as setas navegam e Enter confirma.
      if (Game.state === "question" && down) {
        switch (e.key) {
          case "ArrowUp": case "w": case "W": Quiz.move(-1); e.preventDefault(); return;
          case "ArrowDown": case "s": case "S": Quiz.move(1); e.preventDefault(); return;
          case "Enter": Quiz.confirm(); e.preventDefault(); return;
        }
      }
      switch (e.key) {
        case "ArrowUp": case "w": case "W": this.keys.up = down; e.preventDefault(); break;
        case "ArrowDown": case "s": case "S": this.keys.down = down; e.preventDefault(); break;
        case "ArrowLeft": case "a": case "A": this.keys.left = down; e.preventDefault(); break;
        case "ArrowRight": case "d": case "D": this.keys.right = down; e.preventDefault(); break;
        case " ": if (down) tryActivateNitro(); e.preventDefault(); break;
        case "f": case "F": if (down) toggleFullscreen(); break;
        case "m": case "M": if (down) toggleMusicBtn(); break;
        case "Escape": case "p": case "P": if (down) togglePause(); break;
      }
    }
  };

  /* ==============================================================
     GAMEPAD (controle com fio / sem fio — Gamepad API)
     Mapeamento padrão (layout Xbox/genérico):
       - Direção: analógico esquerdo (eixo 0) ou D-pad ← →
       - Acelerar: gatilho RT (7) / botão A (0) / analógico p/ cima
       - Frear/ré: gatilho LT (6) / botão B (1) / analógico p/ baixo
       - Nitro: X (2), LB (4) ou RB (5)
       - Iniciar / Reiniciar / Confirmar no menu: A (0) ou Start (9)
       - Navegar pergunta: D-pad ↑↓ ou analógico; A confirma
     ============================================================== */
  const Gamepad = {
    index: null,
    prev: [],        // estado dos botões no frame anterior (p/ detectar borda)
    prevStickY: 0,   // p/ borda do analógico na navegação de menus
    deadzone: 0.25,

    start() {
      window.addEventListener("gamepadconnected", (e) => {
        this.index = e.gamepad.index;
        showToast("🎮 Controle conectado", "#19ff8a", 1400);
      });
      window.addEventListener("gamepaddisconnected", (e) => {
        if (this.index === e.gamepad.index) this.index = null;
      });
      // Loop próprio sempre ativo (funciona também nos menus).
      const tick = () => { this.poll(); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    },

    getPad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (this.index != null && pads[this.index]) return pads[this.index];
      for (const p of pads) if (p) { this.index = p.index; return p; }
      return null;
    },

    axis(gp, i) {
      const v = gp.axes[i] || 0;
      return Math.abs(v) < this.deadzone ? 0 : v;
    },

    poll() {
      const gp = this.getPad();
      if (!gp) return;

      // Snapshot dos botões e helper de borda (pressionado agora, solto antes).
      const pressed = gp.buttons.map(b => !!(b && b.pressed));
      const value = gp.buttons.map(b => (b ? b.value : 0));
      const edge = (i) => pressed[i] && !this.prev[i];
      const down = (i) => !!pressed[i];

      // ---------- Condução (corrida / contagem) ----------
      if (Game.state === "racing" || Game.state === "countdown") {
        let steer = this.axis(gp, 0);
        if (down(14)) steer = -1;   // D-pad esquerda
        if (down(15)) steer = 1;    // D-pad direita

        const stickY = this.axis(gp, 1);
        const accel = Math.max(value[7] || 0, down(0) ? 1 : 0, stickY < 0 ? -stickY : 0);
        const brake = Math.max(value[6] || 0, down(1) ? 1 : 0, stickY > 0 ? stickY : 0);
        const throttle = accel - brake;

        if (Math.abs(steer) > 0.04 || Math.abs(throttle) > 0.04) {
          Input.analog.active = true;
          Input.analog.steer = Math.max(-1, Math.min(1, steer));
          Input.analog.throttle = Math.max(-1, Math.min(1, throttle));
          Input.analog.fromPad = true;
        } else if (Input.analog.fromPad) {
          // Controle ocioso: libera para o teclado novamente.
          Input.analog.active = false;
        }

        if (edge(2) || edge(4) || edge(5)) tryActivateNitro();
        if (edge(9)) pauseGame();   // botão Start pausa
      }

      // ---------- Menu de pausa ----------
      if (Game.state === "paused") {
        if (edge(0) || edge(9)) resumeGame();  // A / Start: continuar
        else if (edge(1)) exitToStart();       // B: sair
      }

      // ---------- Navegação na tela inicial ----------
      const startActive = document.getElementById("start-screen").classList.contains("active");
      const endActive = document.getElementById("end-screen").classList.contains("active");

      if (startActive && (edge(0) || edge(9))) {
        const name = (document.getElementById("player-name").value || "").trim() || "Piloto";
        GameAudio.init(); GameAudio.resume();
        startRace(name);
      } else if (endActive && (edge(0) || edge(9))) {
        showScreen("start-screen");
      }

      // ---------- Navegação na pergunta ----------
      if (Game.state === "question" && !Quiz.answered) {
        // D-pad ↑/↓
        if (edge(13)) Quiz.move(1);
        if (edge(12)) Quiz.move(-1);
        // Analógico vertical (com borda)
        const sy = this.axis(gp, 1);
        if (sy > 0.5 && this.prevStickY <= 0.5) Quiz.move(1);
        if (sy < -0.5 && this.prevStickY >= -0.5) Quiz.move(-1);
        this.prevStickY = sy;
        // A confirma a opção selecionada
        if (edge(0)) Quiz.confirm();
      }

      this.prev = pressed;
    }
  };

  /* ==============================================================
     CONSTRUÇÃO DA PISTA (Catmull-Rom fechado)
     ============================================================== */
  function buildTrack() {
    // Pontos de controle do circuito (coordenadas de mundo).
    const ctrl = [
      { x: 1500, y: 300 }, { x: 2150, y: 380 }, { x: 2650, y: 780 },
      { x: 2520, y: 1300 }, { x: 2780, y: 1750 }, { x: 2300, y: 2050 },
      { x: 1750, y: 1880 }, { x: 1380, y: 2120 }, { x: 820, y: 1980 },
      { x: 480, y: 1520 }, { x: 700, y: 1000 }, { x: 380, y: 560 },
      { x: 880, y: 320 }
    ];

    const points = [];
    const SEG = 16; // amostras por segmento
    const n = ctrl.length;
    for (let i = 0; i < n; i++) {
      const p0 = ctrl[(i - 1 + n) % n];
      const p1 = ctrl[i];
      const p2 = ctrl[(i + 1) % n];
      const p3 = ctrl[(i + 2) % n];
      for (let s = 0; s < SEG; s++) {
        const t = s / SEG;
        points.push(catmullRom(p0, p1, p2, p3, t));
      }
    }

    // Comprimento acumulado (para info/estimativas).
    let length = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      length += Math.hypot(b.x - a.x, b.y - a.y);
    }

    return { points, halfWidth: 115, length, start: points[0] };
  }

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }

  // Direção (rad) da pista num índice de waypoint.
  function trackAngleAt(idx) {
    const pts = Game.track.points;
    const a = pts[idx], b = pts[(idx + 1) % pts.length];
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  // Encontra o índice do waypoint mais próximo do carro (busca em janela).
  function findNearest(car) {
    const pts = Game.track.points;
    const N = pts.length;
    let best = car.checkpoint || 0, bestD = Infinity;
    const W = 14;
    for (let o = -W; o <= W; o++) {
      const i = (car.checkpoint + o + N) % N;
      const d = (pts[i].x - car.x) ** 2 + (pts[i].y - car.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    // Se ficou longe demais, faz busca completa (carro perdido).
    if (bestD > (Game.track.halfWidth * 3) ** 2) {
      for (let i = 0; i < N; i++) {
        const d = (pts[i].x - car.x) ** 2 + (pts[i].y - car.y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return { index: best, dist: Math.sqrt(bestD) };
  }

  /* ==============================================================
     POSICIONAMENTO INICIAL (grid de largada)
     ============================================================== */
  function placeGrid() {
    const pts = Game.track.points;
    const angle = trackAngleAt(0);
    const perp = angle + Math.PI / 2;   // lateral

    // Grid logo APÓS a linha de largada (sentido de corrida), em duas colunas.
    // Assim, a primeira volta só é contabilizada após um giro completo.
    Game.cars.forEach((car, i) => {
      const row = Math.floor(i / 2);
      const col = (i % 2) === 0 ? -1 : 1;
      const bx = pts[0].x + Math.cos(angle) * (50 + row * 70);
      const by = pts[0].y + Math.sin(angle) * (50 + row * 70);
      car.x = bx + Math.cos(perp) * col * 45;
      car.y = by + Math.sin(perp) * col * 45;
      car.angle = angle;
      car.speed = 0;
      car.lap = 0;
      car.progress = 0;
      car.finished = false;
      car.finishTime = 0;
      car.lapStart = 0;
      car.bestLap = Infinity;
      car.overtakes = 0;
      car.nitroTime = 0;
      car.penaltyTime = 0;
      car.checkpoint = 2; // logo após a linha (índice baixo)
    });
  }

  /* ==============================================================
     CRIAÇÃO DOS CARROS
     ============================================================== */
  function createCars(playerName) {
    Game.cars = [];

    // Jogador
    const player = new Player(0, 0, 0, playerName || "Piloto", CAR_COLORS[0]);
    player.nitroCharges = 0;
    Game.player = player;
    Game.cars.push(player);

    // Embaralha nomes da IA
    const names = AI_NAMES.slice();
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    for (let i = 0; i < CONFIG.numOpponents; i++) {
      const skill = 0.55 + Math.random() * 0.45; // habilidade variada
      const ai = new AICar(0, 0, 0, names[i] || ("Bot " + (i + 1)), CAR_COLORS[(i + 1) % CAR_COLORS.length], skill);
      Game.cars.push(ai);
    }

    placeGrid();
  }

  /* ==============================================================
     ATUALIZAÇÃO DE PROGRESSO / VOLTAS / POSIÇÕES
     ============================================================== */
  function updateProgress(car) {
    const N = Game.track.points.length;
    const near = findNearest(car);
    const prev = car.checkpoint;
    const idx = near.index;

    // Detecta cruzamento da linha (wrap de índice).
    const delta = idx - prev;
    if (delta < -N / 2) {
      // avançou e cruzou o início -> nova volta
      car.lap++;
      onLapComplete(car);
    } else if (delta > N / 2) {
      // voltou de ré cruzando o início -> desconta
      car.lap = Math.max(0, car.lap - 1);
    }
    car.checkpoint = idx;
    car.onTrack = near.dist <= Game.track.halfWidth + 14;
    car.progress = car.lap * N + idx;

    // Finaliza ao completar as voltas alvo.
    if (!car.finished && car.lap >= CONFIG.totalLaps) {
      car.finished = true;
      car.finishTime = Game.elapsed;
    }
  }

  function onLapComplete(car) {
    const lapTime = Game.elapsed - car.lapStart;
    car.lapStart = Game.elapsed;
    if (car.lap >= 1 && lapTime > 0 && lapTime < car.bestLap) {
      car.bestLap = lapTime;
    }
    if (car.isPlayer && car.lap <= CONFIG.totalLaps) {
      Game.score += 100; // pontos por volta concluída
      showToast("VOLTA " + car.lap, "#19ff8a", 1000);
    }
  }

  // Calcula e atribui posições (1 = líder).
  function updatePositions() {
    const ordered = Game.cars.slice().sort((a, b) => {
      // Finalizados primeiro (por tempo), depois por progresso.
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    ordered.forEach((car, i) => { car.position = i + 1; });

    // Ultrapassagens do jogador (melhora de posição).
    const p = Game.player.position;
    if (p < Game.lastPlayerPos) {
      const gained = Game.lastPlayerPos - p;
      Game.player.overtakes += gained;
      Game.score += gained * 25;
      showToast("ULTRAPASSAGEM! +" + (gained * 25), "#00f0ff", 900);
    }
    Game.lastPlayerPos = p;
  }

  /* ==============================================================
     COLISÃO SIMPLES ENTRE CARROS (separação)
     ============================================================== */
  function resolveCollisions() {
    const cars = Game.cars;
    const R = 26;
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i], b = cars[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < R * 2) {
          const overlap = (R * 2 - d) / 2;
          const nx = dx / d, ny = dy / d;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          // pequena perda de velocidade no contato
          a.speed *= 0.96; b.speed *= 0.96;
        }
      }
    }
  }

  /* ==============================================================
     NITRO
     ============================================================== */
  function tryActivateNitro() {
    const p = Game.player;
    if (!p || Game.state !== "racing") return;
    if (p.nitroTime > 0) return;          // já ativo
    if (p.nitroCharges <= 0) return;      // sem carga
    p.nitroCharges--;
    CarPhysics.activateNitro(p, CONFIG.nitroDuration);
    GameAudio.nitroSound();
    showToast("NITRO!", "#ffe600", 900);
  }

  /* ==============================================================
     PERGUNTAS
     ============================================================== */
  const Quiz = {
    current: null,
    timer: 0,
    answered: false,
    optButtons: [],     // referências aos botões de opção
    selectedIndex: 0,   // opção destacada (navegação por teclado/controle)

    open() {
      Game.state = "question";
      this.current = QuestionPool.next();
      this.answered = false;
      this.timer = CONFIG.questionTime;
      this.selectedIndex = 0;
      this.optButtons = [];

      const modal = document.getElementById("question-modal");
      document.getElementById("q-text").textContent = this.current.q;
      document.getElementById("q-feedback").textContent = "";
      const wrap = document.getElementById("q-options");
      wrap.innerHTML = "";

      const letters = ["A", "B", "C", "D"];
      this.current.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "q-opt";
        btn.innerHTML = `<span class="opt-key">${letters[i]})</span> ${escapeHtml(opt)}`;
        btn.addEventListener("click", () => this.answer(i, btn));
        btn.addEventListener("mousemove", () => this.select(i));
        wrap.appendChild(btn);
        this.optButtons.push(btn);
      });

      this.highlight();
      modal.classList.add("active");
    },

    // Move a seleção (navegação por controle/teclado), com wrap.
    move(dir) {
      if (this.answered || this.optButtons.length === 0) return;
      const n = this.optButtons.length;
      this.selectedIndex = (this.selectedIndex + dir + n) % n;
      this.highlight();
    },
    select(i) {
      if (this.answered) return;
      this.selectedIndex = i;
      this.highlight();
    },
    highlight() {
      this.optButtons.forEach((b, k) => b.classList.toggle("sel", k === this.selectedIndex));
    },
    // Confirma a opção destacada (botão A do controle).
    confirm() {
      if (this.answered) return;
      const i = this.selectedIndex;
      this.answer(i, this.optButtons[i]);
    },

    answer(i, btn) {
      if (this.answered) return;
      this.answered = true;
      const correct = this.current.answer;
      const opts = document.querySelectorAll("#q-options .q-opt");
      opts.forEach((b, k) => {
        b.disabled = true;
        if (k === correct) b.classList.add("correct");
      });
      const fb = document.getElementById("q-feedback");

      if (i === correct) {
        if (btn) btn.classList.add("correct");
        fb.style.color = "#19ff8a";
        fb.textContent = "Correto! Nitro liberado 🚀";
        GameAudio.correctSound();
        Game.player.nitroCharges++;
        Game.score += 150;
        Game.correctCount++;
        CarPhysics.activateNitro(Game.player, CONFIG.nitroDuration);
        Game.player.nitroCharges = Math.max(0, Game.player.nitroCharges - 1);
      } else {
        if (btn) btn.classList.add("wrong");
        fb.style.color = "#ff4d6d";
        fb.textContent = "Resposta incorreta! Velocidade reduzida.";
        GameAudio.wrongSound();
        CarPhysics.applyPenalty(Game.player, CONFIG.penaltyDuration);
      }

      setTimeout(() => this.close(), 1500);
    },

    update(dt) {
      if (Game.state !== "question" || this.answered) return;
      this.timer -= dt;
      document.getElementById("q-timer").textContent = Math.ceil(Math.max(0, this.timer));
      if (this.timer <= 0) {
        // tempo esgotado conta como erro
        this.answer(-1, null);
      }
    },

    close() {
      document.getElementById("question-modal").classList.remove("active");
      if (Game.state === "question") Game.state = "racing";
    }
  };

  /* ==============================================================
     PONTUAÇÃO CONTÍNUA
     ============================================================== */
  function updateScore(dt) {
    const p = Game.player;
    // Tempo em primeiro lugar
    if (p.position === 1) {
      Game.firstPlaceTime += dt;
      Game.score += 5 * dt;
    }
    // Uso eficiente do nitro (recompensa por manter velocidade alta)
    if (p.nitroActive && p.onTrack && Math.abs(p.speed) > p.maxSpeed * 0.8) {
      Game.score += 10 * dt;
    }
  }

  /* ==============================================================
     PARTÍCULAS
     ============================================================== */
  function spawnParticle(x, y, vx, vy, life, color, size, grow) {
    Game.particles.push({ x, y, vx, vy, life, maxLife: life, color, size, grow: grow || 0 });
  }

  // Tons de areia para a poeira fora da pista.
  const SAND_COLORS = ["#d8c08f", "#c9a96a", "#b8915a", "#a87f4e", "#e7d4a6"];

  function emitCarParticles(car) {
    const back = car.angle + Math.PI;
    const bx = car.x + Math.cos(back) * 18;
    const by = car.y + Math.sin(back) * 18;

    // Poeira de areia ao sair da pista (efeito de areia subindo).
    if (car.onTrack === false && Math.abs(car.speed) > 35) {
      const intensity = Math.min(1, Math.abs(car.speed) / car.maxSpeed);
      const count = 2 + Math.floor(intensity * 3);
      for (let k = 0; k < count; k++) {
        // Jato espalhado para trás/lateral, partículas crescem e desaceleram
        // (lê-se como nuvem de areia levantando).
        const a = back + (Math.random() - 0.5) * 1.6;
        const sp = 25 + Math.random() * 80 * intensity;
        const col = SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)];
        spawnParticle(
          car.x + (Math.random() - 0.5) * 22,
          car.y + (Math.random() - 0.5) * 22,
          Math.cos(a) * sp, Math.sin(a) * sp,
          0.6 + Math.random() * 0.5,
          col, 3 + Math.random() * 4, 16 + Math.random() * 12
        );
      }
    }

    if (car.nitroActive) {
      for (let k = 0; k < 3; k++) {
        const a = back + (Math.random() - 0.5) * 0.6;
        const sp = 120 + Math.random() * 160;
        spawnParticle(bx, by, Math.cos(a) * sp + car.speed * Math.cos(back) * 0.3,
          Math.sin(a) * sp, 0.5, Math.random() < 0.5 ? "#ffe600" : "#ff00d4", 4 + Math.random() * 4);
      }
    } else if (car.onTrack !== false && Math.abs(car.speed) > car.maxSpeed * 0.4 && Math.random() < 0.5) {
      const a = back + (Math.random() - 0.5) * 0.4;
      spawnParticle(bx, by, Math.cos(a) * 40, Math.sin(a) * 40, 0.4, "rgba(120,160,200,0.5)", 3);
    }
  }

  function updateParticles(dt) {
    const ps = Game.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.94; p.vy *= 0.94;
    }
  }

  // Bits (0/1) flutuando pelo cenário (chuva de bits em coordenadas de mundo).
  function initWorldBits() {
    Game.worldBits = [];
    for (let i = 0; i < 90; i++) {
      Game.worldBits.push(makeBit(true));
    }
  }
  function makeBit(spread) {
    const p = Game.player || { x: 1500, y: 1100 };
    const range = 1400;
    return {
      x: p.x + (Math.random() - 0.5) * range * 2,
      y: p.y + (Math.random() - 0.5) * range * 2,
      vy: 20 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 20,
      char: Math.random() < 0.5 ? "0" : "1",
      alpha: 0.15 + Math.random() * 0.4,
      size: 12 + Math.random() * 14
    };
  }
  function updateWorldBits(dt) {
    const p = Game.player;
    for (const b of Game.worldBits) {
      b.y += b.vy * dt; b.x += b.vx * dt;
      // recicla quando longe da câmera
      if (Math.hypot(b.x - p.x, b.y - p.y) > 1700) {
        Object.assign(b, makeBit(true));
        b.y = p.y - 1400 + Math.random() * 200; // reentra pelo topo
      }
    }
  }

  /* ==============================================================
     LOOP PRINCIPAL
     ============================================================== */
  function loop(now) {
    Game.raf = requestAnimationFrame(loop);
    let dt = (now - Game.lastT) / 1000;
    Game.lastT = now;
    if (!dt || dt > 0.1) dt = 0.016; // clamp (evita saltos)

    update(dt);
    render();
  }

  function update(dt) {
    // Contagem regressiva inicial.
    if (Game.state === "countdown") {
      Game.countdown -= dt;
      if (Game.countdown <= 0) {
        Game.state = "racing";
        showToast("GO!", "#19ff8a", 800);
      }
      // motor em marcha lenta
      GameAudio.updateEngine(0.05, false);
      return;
    }

    if (Game.state === "question") {
      Quiz.update(dt);
      GameAudio.updateEngine(0.05, false);
      return;
    }

    // Jogo pausado: congela tudo (cronômetro, IA, perguntas) e idle no motor.
    if (Game.state === "paused") {
      GameAudio.updateEngine(0.05, false);
      return;
    }

    if (Game.state !== "racing") return;

    // Tempo de corrida.
    Game.elapsed += dt;

    // Disparo de perguntas a cada intervalo.
    if (Game.elapsed - Game.lastQuestionAt >= CONFIG.questionInterval) {
      Game.lastQuestionAt = Game.elapsed;
      Quiz.open();
      return;
    }

    // Atualiza física de todos os carros.
    for (const car of Game.cars) {
      if (car.finished) { car.speed *= 0.9; continue; }
      const env = { dt, onTrack: car.onTrack !== false };
      if (car.isPlayer) {
        car.update(env, Input.keys, Input.analog);
      } else {
        car.update(env, Game.track);
      }
      emitCarParticles(car);
    }

    resolveCollisions();

    // Progresso e posições.
    for (const car of Game.cars) updateProgress(car);
    updatePositions();

    updateScore(dt);
    updateParticles(dt);
    updateWorldBits(dt);

    // Áudio do motor conforme velocidade do jogador.
    const sr = Math.min(1, Math.abs(Game.player.speed) / PHYS.baseMaxSpeed);
    GameAudio.updateEngine(sr, Game.player.nitroActive);

    // Fim por tempo ou por término do jogador.
    if (Game.elapsed >= CONFIG.duration || Game.player.finished) {
      endRace();
      return;
    }

    updateHUD();
  }

  /* ==============================================================
     RENDERIZAÇÃO
     ============================================================== */
  function render() {
    const ctx = Game.ctx;
    const dpr = Game.dpr;
    // limpa em espaço de tela
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, Game.view.w, Game.view.h);

    if (!Game.player) return;

    // Câmera centrada no jogador.
    const z = Game.zoom;
    const camX = Game.player.x, camY = Game.player.y;
    ctx.setTransform(z * dpr, 0, 0, z * dpr,
      (Game.view.w / 2 - camX * z) * dpr,
      (Game.view.h / 2 - camY * z) * dpr);

    drawGround(ctx, camX, camY);
    drawTrack(ctx);
    drawWorldBits(ctx);
    drawHoloSigns(ctx);
    drawParticles(ctx);
    for (const car of Game.cars) if (!car.isPlayer) drawCar(ctx, car);
    drawCar(ctx, Game.player);

    // Overlays em espaço de tela.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSpeedLines(ctx);
    drawCountdown(ctx);
  }

  // Fundo: terreno de AREIA (marrom) fora da pista, com textura de grãos.
  function drawGround(ctx, camX, camY) {
    const margin = 100;
    const left = camX - Game.view.w / Game.zoom / 2 - margin;
    const top = camY - Game.view.h / Game.zoom / 2 - margin;
    const right = camX + Game.view.w / Game.zoom / 2 + margin;
    const bottom = camY + Game.view.h / Game.zoom / 2 + margin;

    // Base de areia.
    ctx.fillStyle = "#b8915a";
    ctx.fillRect(left, top, right - left, bottom - top);

    // Textura: grãos/manchas estáveis (hash por célula evita cintilação).
    const cell = 56;
    const sx = Math.floor(left / cell) * cell;
    const sy = Math.floor(top / cell) * cell;
    for (let x = sx; x < right; x += cell) {
      for (let y = sy; y < bottom; y += cell) {
        const h = (((x * 73856093) ^ (y * 19349663)) >>> 0);
        const ox = h % cell;
        const oy = (h >> 7) % cell;
        const shade = (h >> 14) & 3;
        if (shade === 0) ctx.fillStyle = "rgba(90,62,32,0.22)";
        else if (shade === 1) ctx.fillStyle = "rgba(228,205,150,0.30)";
        else ctx.fillStyle = "rgba(160,120,70,0.20)";
        const s = 2 + (h >> 20) % 3;
        ctx.fillRect(x + ox, y + oy, s, s);
      }
    }

    // Leve grade tecnológica por cima, bem sutil (mantém o clima cyber).
    const grid = 80;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(60,40,20,0.10)";
    ctx.beginPath();
    for (let x = Math.floor(left / grid) * grid; x < right; x += grid) {
      ctx.moveTo(x, top); ctx.lineTo(x, bottom);
    }
    for (let y = Math.floor(top / grid) * grid; y < bottom; y += grid) {
      ctx.moveTo(left, y); ctx.lineTo(right, y);
    }
    ctx.stroke();
  }

  function drawTrack(ctx) {
    const pts = Game.track.points;
    const hw = Game.track.halfWidth;

    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
    };

    // 1) Brilho neon (borda externa)
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 26;
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = hw * 2 + 14;
    trace(); ctx.stroke();

    // 2) Asfalto
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#0c0c1e";
    ctx.lineWidth = hw * 2;
    trace(); ctx.stroke();

    // 3) Linha central tracejada (magenta)
    ctx.strokeStyle = "rgba(255,0,212,0.55)";
    ctx.lineWidth = 4;
    ctx.setLineDash([26, 22]);
    trace(); ctx.stroke();
    ctx.setLineDash([]);

    // 4) Nós de circuito pulsantes nas laterais
    drawCircuitNodes(ctx);

    // 5) Linha de largada/chegada (xadrez)
    drawStartLine(ctx);
  }

  function drawCircuitNodes(ctx) {
    const pts = Game.track.points;
    const hw = Game.track.halfWidth;
    const t = performance.now() / 600;
    for (let i = 0; i < pts.length; i += 6) {
      const ang = trackAngleAt(i);
      const perp = ang + Math.PI / 2;
      for (const side of [-1, 1]) {
        const x = pts[i].x + Math.cos(perp) * (hw + 22) * side;
        const y = pts[i].y + Math.sin(perp) * (hw + 22) * side;
        const pulse = 0.5 + 0.5 * Math.sin(t + i);
        ctx.fillStyle = `rgba(25,255,138,${0.25 + pulse * 0.5})`;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }
  }

  function drawStartLine(ctx) {
    const pts = Game.track.points;
    const hw = Game.track.halfWidth;
    const ang = trackAngleAt(0);
    const perp = ang + Math.PI / 2;
    const cx = pts[0].x, cy = pts[0].y;
    const cols = 8;
    const cell = (hw * 2) / cols;
    ctx.save();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const off = -hw + c * cell;
        const x = cx + Math.cos(perp) * off + Math.cos(ang) * (r * cell);
        const y = cy + Math.sin(perp) * off + Math.sin(ang) * (r * cell);
        ctx.fillStyle = ((r + c) % 2 === 0) ? "#ffffff" : "#0a0a14";
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.fillRect(-cell / 2, -cell / 2, cell, cell);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // Placas holográficas espalhadas pela pista.
  const SIGN_TEXTS = ["</> SPEED", "01001", "TURBO+", "DATA", "NITRO", "BIT ZONE", "v=c"];
  function drawHoloSigns(ctx) {
    const pts = Game.track.points;
    const hw = Game.track.halfWidth;
    const t = performance.now() / 1000;
    for (let i = 8; i < pts.length; i += 22) {
      const ang = trackAngleAt(i);
      const perp = ang + Math.PI / 2;
      const side = (i % 2 === 0) ? 1 : -1;
      const x = pts[i].x + Math.cos(perp) * (hw + 70) * side;
      const y = pts[i].y + Math.sin(perp) * (hw + 70) * side;
      const flick = 0.6 + 0.4 * Math.sin(t * 3 + i);
      ctx.save();
      ctx.globalAlpha = flick;
      ctx.fillStyle = "rgba(0,240,255,0.10)";
      ctx.fillRect(x - 42, y - 24, 84, 34);
      ctx.strokeStyle = "rgba(0,240,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 42, y - 24, 84, 34);
      ctx.fillStyle = "#aef6ff";
      ctx.font = "bold 16px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(SIGN_TEXTS[(i) % SIGN_TEXTS.length], x, y - 2);
      ctx.restore();
    }
  }

  function drawWorldBits(ctx) {
    ctx.font = "16px Consolas, monospace";
    ctx.textAlign = "center";
    for (const b of Game.worldBits) {
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = b.char === "1" ? "#19ff8a" : "#00f0ff";
      ctx.font = `${b.size}px Consolas, monospace`;
      ctx.fillText(b.char, b.x, b.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles(ctx) {
    for (const p of Game.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      // Partículas com "grow" expandem ao longo da vida (poeira/areia subindo).
      const r = p.size + (p.grow ? (p.maxLife - p.life) * p.grow : 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Chama do nitro
    if (car.nitroActive) {
      const fl = 26 + Math.random() * 18;
      const grd = ctx.createLinearGradient(-18 - fl, 0, -18, 0);
      grd.addColorStop(0, "rgba(255,230,0,0)");
      grd.addColorStop(1, "rgba(255,120,0,0.9)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(-18, -7); ctx.lineTo(-18 - fl, 0); ctx.lineTo(-18, 7);
      ctx.closePath(); ctx.fill();
    }

    // Sombra/iluminação
    ctx.shadowColor = car.color;
    ctx.shadowBlur = car.isPlayer ? 22 : 10;

    // Corpo (estilo F1)
    ctx.fillStyle = car.color;
    roundRect(ctx, -20, -9, 40, 18, 5); ctx.fill();
    // Cockpit escuro
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(ctx, -2, -6, 12, 12, 3); ctx.fill();
    // Asas
    ctx.fillStyle = "#101018";
    ctx.fillRect(16, -11, 5, 22);  // aerofólio dianteiro
    ctx.fillRect(-22, -12, 5, 24); // aerofólio traseiro
    // Rodas
    ctx.fillStyle = "#05050a";
    ctx.fillRect(8, -13, 8, 5); ctx.fillRect(8, 8, 8, 5);
    ctx.fillRect(-16, -13, 8, 5); ctx.fillRect(-16, 8, 8, 5);

    // Penalidade: brilho vermelho
    if (car.penaltyActive) {
      ctx.shadowColor = "#ff2e63"; ctx.shadowBlur = 18;
      ctx.strokeStyle = "#ff2e63"; ctx.lineWidth = 2;
      roundRect(ctx, -20, -9, 40, 18, 5); ctx.stroke();
    }
    ctx.restore();

    // Nome do piloto (espaço de mundo, texto não rotacionado)
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = car.isPlayer ? "#ffffff" : "rgba(200,230,255,0.7)";
    ctx.font = (car.isPlayer ? "bold 13px " : "11px ") + "Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(car.name, car.x, car.y - 24);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Linhas de velocidade (espaço de tela) quando muito rápido.
  function drawSpeedLines(ctx) {
    const p = Game.player;
    const sr = Math.abs(p.speed) / PHYS.baseMaxSpeed;
    if (sr < 0.7 && !p.nitroActive) return;
    const intensity = p.nitroActive ? 1 : (sr - 0.7) / 0.3;
    const cx = Game.view.w / 2, cy = Game.view.h / 2;
    ctx.save();
    ctx.strokeStyle = p.nitroActive ? "rgba(255,230,0,0.5)" : "rgba(0,240,255,0.35)";
    ctx.lineWidth = 2;
    const count = Math.floor(10 * intensity);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r1 = Math.min(cx, cy) * (0.6 + Math.random() * 0.4);
      const r2 = r1 + 40 + Math.random() * 60;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCountdown(ctx) {
    if (Game.state !== "countdown") return;
    const n = Math.ceil(Game.countdown);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, Game.view.w, Game.view.h);
    ctx.fillStyle = "#00f0ff";
    ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 30;
    ctx.font = "bold 140px Segoe UI, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(n > 0 ? n : "GO", Game.view.w / 2, Game.view.h / 2);
    ctx.restore();
  }

  /* ==============================================================
     HUD
     ============================================================== */
  function updateHUD() {
    const p = Game.player;
    setText("hud-name", p.name);
    setText("hud-position", p.position + "º / " + Game.cars.length);
    setText("hud-time", formatTime(Math.max(0, CONFIG.duration - Game.elapsed)));
    setText("hud-lap", Math.min(p.lap + 1, CONFIG.totalLaps) + " / " + CONFIG.totalLaps);
    setText("hud-score", Math.floor(Game.score));
    setText("hud-correct", Game.correctCount);
    setText("hud-bestlap", p.bestLap === Infinity ? "--:--" : formatTime(p.bestLap));
    setText("hud-speed", CarPhysics.toKmh(p));

    // Nitro
    const fill = document.getElementById("nitro-fill");
    const state = document.getElementById("nitro-state");
    if (p.nitroTime > 0) {
      fill.style.width = (p.nitroTime / CONFIG.nitroDuration * 100) + "%";
      state.textContent = "ATIVO";
    } else if (p.nitroCharges > 0) {
      fill.style.width = "100%";
      state.textContent = "PRONTO (" + p.nitroCharges + ")";
    } else {
      fill.style.width = "0%";
      state.textContent = p.penaltyActive ? "PENALIDADE" : "VAZIO";
    }
  }

  /* ==============================================================
     INÍCIO / FIM DA CORRIDA
     ============================================================== */
  function startRace(name) {
    document.body.dataset.player = name;
    createCars(name);
    initWorldBits();
    Game.particles = [];
    Game.elapsed = 0;
    Game.lastQuestionAt = 0;
    Game.score = 0;
    Game.correctCount = 0;
    Game.firstPlaceTime = 0;
    Game.lastPlayerPos = Game.cars.length;
    Game.player.lapStart = 0;
    Game.countdown = CONFIG.startCountdown;
    QuestionPool.reset();

    showScreen("game-screen");
    resize();
    GameAudio.startAll();
    updateHUD();

    Game.state = "countdown";
    if (!Game.raf) {
      Game.lastT = performance.now();
      Game.raf = requestAnimationFrame(loop);
    }
  }

  function endRace() {
    if (Game.state === "finished") return;
    Game.state = "finished";
    GameAudio.finishSound();
    GameAudio.stopEngine();

    updatePositions();
    const p = Game.player;
    const finalTime = p.finished ? p.finishTime : CONFIG.duration;

    // Monta o registro (id único para localizar a posição no ranking).
    const record = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: p.name,
      position: p.position,
      timeSec: p.finished ? p.finishTime : CONFIG.duration + (Game.cars.length - p.position),
      timeStr: formatTime(finalTime),
      score: Math.floor(Game.score),
      correct: Game.correctCount,
      bestLap: p.bestLap === Infinity ? null : p.bestLap
    };

    // Preenche tela final.
    setText("r-name", p.name);
    setText("r-position", p.position + "º / " + Game.cars.length);
    setText("r-time", formatTime(finalTime));
    setText("r-score", Math.floor(Game.score));
    setText("r-correct", Game.correctCount);
    setText("r-bestlap", p.bestLap === Infinity ? "--:--" : formatTime(p.bestLap));

    showScreen("end-screen");
    setRankingStatus("Salvando ranking...");

    // Grava no ranking (servidor + espelho local) de forma assíncrona.
    Ranking.add(record).then(({ list, rankIndex, online }) => {
      renderRanking(list, rankIndex);
      setRankingStatus(online ? "🌐 Ranking global (online)" : "💾 Ranking local (offline)");
    }).catch(() => {
      renderRanking([], -1);
      setRankingStatus("💾 Ranking local (offline)");
    });
  }

  function setRankingStatus(txt) {
    const el = document.getElementById("ranking-status");
    if (el) el.textContent = txt;
  }

  function renderRanking(list, meIndex) {
    const ol = document.getElementById("ranking-list");
    ol.innerHTML = "";
    list.forEach((rec, i) => {
      const li = document.createElement("li");
      if (i === meIndex) li.classList.add("me");
      li.innerHTML = `<span class="r-name">${escapeHtml(rec.name)}</span>` +
        `<span class="r-time">${escapeHtml(rec.timeStr || "")}</span>`;
      ol.appendChild(li);
    });
    if (list.length === 0) {
      ol.innerHTML = '<li><span class="r-name">Sem registros ainda</span></li>';
    }
  }

  // Top 5 do ranking exibido na tela inicial.
  function renderTop5() {
    const ol = document.getElementById("top5-list");
    if (!ol) return;
    Ranking.getTop10().then(({ list }) => {
      ol.innerHTML = "";
      list.slice(0, 5).forEach(rec => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="r-name">${escapeHtml(rec.name)}</span>` +
          `<span class="r-score">${rec.score != null ? Math.floor(rec.score) + " pts" : ""}</span>` +
          `<span class="r-time">${escapeHtml(rec.timeStr || "")}</span>`;
        ol.appendChild(li);
      });
      if (list.length === 0) {
        ol.innerHTML = '<li><span class="r-name">Sem registros ainda</span></li>';
      }
    });
  }

  /* ==============================================================
     TELAS / UTILIDADES
     ============================================================== */
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    if (id === "start-screen") renderTop5();
  }

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  let toastTimer = null;
  function showToast(msg, color, dur) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.style.color = color || "#fff";
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), dur || 1000);
  }

  /* ==============================================================
     CANVAS / RESIZE / CÂMERA
     ============================================================== */
  function resize() {
    const c = Game.canvas;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    Game.dpr = dpr;
    const w = c.clientWidth || window.innerWidth;
    const h = c.clientHeight || window.innerHeight;
    Game.view.w = w; Game.view.h = h;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    // Zoom adaptativo (mostra mais pista em telas grandes, foco no mobile).
    Game.zoom = Math.max(0.5, Math.min(1.05, Math.min(w, h) / 760));
  }

  function toggleFullscreen() {
    const el = document.getElementById("game-container");
    if (!document.fullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
    }
  }

  function toggleMusicBtn() {
    const on = GameAudio.toggleMusic();
    const btn = document.getElementById("btn-music");
    btn.classList.toggle("off", !on);
    btn.textContent = on ? "♪" : "✕";
  }

  /* ==============================================================
     CONTROLES TOUCH (joystick + nitro)
     ============================================================== */
  function initTouch() {
    const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    if (isTouch) document.body.classList.add("touch");

    const joy = document.getElementById("joystick");
    const knob = document.getElementById("joystick-knob");
    let active = false, cx = 0, cy = 0, radius = 55;

    const start = (e) => {
      active = true;
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      radius = r.width / 2;
      move(e);
    };
    const move = (e) => {
      if (!active) return;
      const t = e.touches ? e.touches[0] : e;
      let dx = t.clientX - cx, dy = t.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > radius) { dx = dx / d * radius; dy = dy / d * radius; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      Input.analog.active = true;
      Input.analog.steer = Math.max(-1, Math.min(1, dx / radius));
      // Acelera automaticamente ao mover; puxar para baixo freia.
      const fwd = Math.max(-1, Math.min(1, -dy / radius));
      Input.analog.throttle = fwd < -0.3 ? fwd : Math.max(0.6, fwd);
      e.preventDefault();
    };
    const end = (e) => {
      active = false;
      knob.style.transform = "translate(0,0)";
      Input.analog.active = false;
      Input.analog.steer = 0;
      Input.analog.throttle = 0;
    };

    joy.addEventListener("touchstart", start, { passive: false });
    joy.addEventListener("touchmove", move, { passive: false });
    joy.addEventListener("touchend", end);
    joy.addEventListener("mousedown", start);
    window.addEventListener("mousemove", (e) => { if (active) move(e); });
    window.addEventListener("mouseup", end);

    const nb = document.getElementById("nitro-btn");
    const fire = (e) => { tryActivateNitro(); e.preventDefault(); };
    nb.addEventListener("touchstart", fire, { passive: false });
    nb.addEventListener("mousedown", fire);
  }

  /* ==============================================================
     BACKGROUND FX (tela inicial/final) — canvas separado
     ============================================================== */
  const BgFX = {
    canvas: null, ctx: null, bits: [], particles: [], w: 0, h: 0,
    init() {
      this.canvas = document.getElementById("bg-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());
      for (let i = 0; i < 70; i++) this.bits.push(this.makeBit());
      for (let i = 0; i < 60; i++) this.particles.push(this.makeParticle());
      requestAnimationFrame(() => this.loop());
    },
    resize() {
      this.w = this.canvas.width = window.innerWidth;
      this.h = this.canvas.height = window.innerHeight;
    },
    makeBit() {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vy: 20 + Math.random() * 50,
        char: Math.random() < 0.5 ? "0" : "1",
        alpha: 0.1 + Math.random() * 0.5,
        size: 12 + Math.random() * 16
      };
    },
    makeParticle() {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        r: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5
      };
    },
    loop() {
      requestAnimationFrame(() => this.loop());
      // Só anima quando uma tela com fundo está visível.
      const startActive = document.getElementById("start-screen").classList.contains("active");
      const endActive = document.getElementById("end-screen").classList.contains("active");
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      if (!startActive && !endActive) return;

      // Grade
      ctx.strokeStyle = "rgba(0,180,255,0.05)";
      ctx.lineWidth = 1;
      const g = 60;
      ctx.beginPath();
      for (let x = 0; x < this.w; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, this.h); }
      for (let y = 0; y < this.h; y += g) { ctx.moveTo(0, y); ctx.lineTo(this.w, y); }
      ctx.stroke();

      // Circuitos (linhas com cantos)
      const t = performance.now() / 1000;
      ctx.strokeStyle = "rgba(255,0,212,0.12)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = (i + 1) * this.h / 7;
        ctx.beginPath();
        ctx.moveTo(0, y);
        let x = 0;
        while (x < this.w) {
          const step = 60 + (i * 17) % 80;
          x += step;
          const yy = y + (Math.sin(x * 0.01 + t + i) > 0 ? 30 : -30);
          ctx.lineTo(x, y);
          ctx.lineTo(x, yy);
          ctx.lineTo(x + 20, yy);
          ctx.lineTo(x + 20, y);
          x += 20;
        }
        ctx.stroke();
      }

      // Partículas digitais
      for (const p of this.particles) {
        p.x += p.vx * 0.016; p.y += p.vy * 0.016;
        if (p.x < 0) p.x = this.w; if (p.x > this.w) p.x = 0;
        if (p.y < 0) p.y = this.h; if (p.y > this.h) p.y = 0;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      // Chuva de bits
      ctx.font = "16px Consolas, monospace";
      for (const b of this.bits) {
        b.y += b.vy * 0.016;
        if (b.y > this.h + 20) { b.y = -20; b.x = Math.random() * this.w; }
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = b.char === "1" ? "#19ff8a" : "#00f0ff";
        ctx.font = `${b.size}px Consolas, monospace`;
        ctx.fillText(b.char, b.x, b.y);
      }
      ctx.globalAlpha = 1;
    }
  };

  /* ==============================================================
     RESTART
     ============================================================== */
  function restartRace() {
    const name = (Game.player && Game.player.name) || "Piloto";
    Game.state = "start";
    document.getElementById("question-modal").classList.remove("active");
    document.getElementById("pause-modal").classList.remove("active");
    startRace(name);
  }

  /* ==============================================================
     PAUSE / SAIR
     ============================================================== */
  function togglePause() {
    if (Game.state === "racing" || Game.state === "countdown") pauseGame();
    else if (Game.state === "paused") resumeGame();
  }

  function pauseGame() {
    if (Game.state !== "racing" && Game.state !== "countdown") return;
    Game._resumeState = Game.state; // volta para corrida ou contagem
    Game.state = "paused";
    document.getElementById("pause-modal").classList.add("active");
    document.getElementById("btn-pause").textContent = "▶";
  }

  function resumeGame() {
    if (Game.state !== "paused") return;
    document.getElementById("pause-modal").classList.remove("active");
    Game.state = Game._resumeState || "racing";
    Game.lastT = performance.now(); // evita salto de dt após a pausa
    document.getElementById("btn-pause").textContent = "⏸";
  }

  // Sai da corrida e volta para a tela inicial.
  function exitToStart() {
    document.getElementById("pause-modal").classList.remove("active");
    document.getElementById("question-modal").classList.remove("active");
    document.getElementById("btn-pause").textContent = "⏸";
    Game.state = "start";
    GameAudio.stopEngine();   // para o motor, mas mantém a música tocando
    GameAudio.startMusic();   // garante música na tela inicial
    showScreen("start-screen");
  }

  /* ==============================================================
     BOOTSTRAP
     ============================================================== */
  function init() {
    Game.canvas = document.getElementById("game-canvas");
    Game.ctx = Game.canvas.getContext("2d");
    Game.track = buildTrack();

    Input.init();
    Gamepad.start();
    initTouch();
    BgFX.init();

    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", () => setTimeout(resize, 60));

    // Inicia a música assim que o jogo abre. Navegadores costumam bloquear o
    // autoplay com som, então o primeiro gesto do usuário serve de fallback.
    const enableAudio = () => {
      GameAudio.init();
      GameAudio.resume();
      GameAudio.startMusic(); // música de fundo já na tela principal
    };
    enableAudio(); // tenta tocar imediatamente ao abrir
    window.addEventListener("pointerdown", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });

    // Formulário inicial.
    document.getElementById("start-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("player-name").value.trim() || "Piloto";
      GameAudio.init(); GameAudio.resume();
      startRace(name);
    });

    // Botões da tela de jogo.
    document.getElementById("btn-pause").addEventListener("click", togglePause);
    document.getElementById("btn-music").addEventListener("click", toggleMusicBtn);
    document.getElementById("btn-fullscreen").addEventListener("click", toggleFullscreen);
    document.getElementById("btn-restart").addEventListener("click", restartRace);

    // Botões do menu de pausa.
    document.getElementById("resume-btn").addEventListener("click", resumeGame);
    document.getElementById("pause-restart-btn").addEventListener("click", restartRace);
    document.getElementById("exit-btn").addEventListener("click", exitToStart);

    // Tela final.
    document.getElementById("play-again-btn").addEventListener("click", () => {
      showScreen("start-screen");
    });
    document.getElementById("clear-ranking-btn").addEventListener("click", () => {
      setRankingStatus("Limpando...");
      Ranking.clear().then(() => {
        renderRanking([], -1);
        setRankingStatus("Ranking limpo.");
        renderTop5();
      });
    });

    // Top 5 na tela inicial (já ativa no carregamento da página).
    renderTop5();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expor para depuração.
  window.Game = Game;
})();
