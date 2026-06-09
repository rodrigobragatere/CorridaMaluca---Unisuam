/* ================================================================
   ai.js — Adversários controlados por IA.
   Cada IA segue a linha central da pista (waypoints), antecipa
   curvas, tenta ultrapassar com offsets laterais e comete pequenos
   erros aleatórios. Habilidade varia por carro.
   Exposto como window.AICar.
   ================================================================ */

// Normaliza ângulo para o intervalo [-PI, PI].
function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

class AICar {
  constructor(x, y, angle, name, color, skill) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 0;

    // skill: 0 (fraco) a 1 (forte) -> afeta vel. máxima e precisão.
    this.skill = skill;
    this.maxSpeed = PHYS.baseMaxSpeed * (0.82 + skill * 0.2);

    this.name = name;
    this.color = color;
    this.isPlayer = false;

    // Status
    this.nitroTime = 0;
    this.penaltyTime = 0;
    this.nitroActive = false;
    this.penaltyActive = false;

    // Progresso
    this.lap = 0;
    this.checkpoint = 0;
    this.progress = 0;
    this.finished = false;
    this.position = 1;
    this.bestLap = Infinity;
    this.lapStart = 0;
    this.overtakes = 0;

    // Comportamento
    this.offset = (Math.random() - 0.5) * 60; // posição lateral na pista
    this.offsetTimer = Math.random() * 3;
    this.errorTimer = 0;       // tempo restante de "erro"
    this.errorCooldown = 2 + Math.random() * 4;
  }

  /*
    Atualiza a IA.
    env: { dt, onTrack }
    track: objeto da pista com .points (linha central) e .halfWidth
  */
  update(env, track) {
    const dt = env.dt;
    const pts = track.points;
    const N = pts.length;

    // ----- Escolhe um ponto à frente (lookahead) -----
    // Quanto maior a habilidade, mais longe antecipa a curva.
    const lookAhead = 3 + Math.round(this.skill * 4);
    const targetIdx = (this.checkpoint + lookAhead) % N;
    const target = pts[targetIdx];

    // Direção da pista no alvo, para aplicar offset lateral (linha de corrida).
    const after = pts[(targetIdx + 1) % N];
    const tDir = Math.atan2(after.y - target.y, after.x - target.x);
    const perp = tDir + Math.PI / 2;

    // Atualiza o offset lateral periodicamente (tenta ultrapassar).
    this.offsetTimer -= dt;
    if (this.offsetTimer <= 0) {
      this.offsetTimer = 1.5 + Math.random() * 2.5;
      const maxOff = track.halfWidth * 0.7;
      this.offset = (Math.random() - 0.5) * 2 * maxOff;
    }

    const tx = target.x + Math.cos(perp) * this.offset;
    const ty = target.y + Math.sin(perp) * this.offset;

    // ----- Calcula direção desejada -----
    const desired = Math.atan2(ty - this.y, tx - this.x);
    let diff = normalizeAngle(desired - this.angle);

    // ----- Erros aleatórios (perda momentânea de controle) -----
    this.errorCooldown -= dt;
    if (this.errorCooldown <= 0 && this.errorTimer <= 0) {
      // IAs mais fracas erram mais frequentemente.
      if (Math.random() < (1 - this.skill) * 0.5 + 0.05) {
        this.errorTimer = 0.3 + Math.random() * 0.6;
      }
      this.errorCooldown = 2 + Math.random() * 4;
    }
    let errorSteer = 0, throttleCut = 1;
    if (this.errorTimer > 0) {
      this.errorTimer -= dt;
      errorSteer = (Math.random() - 0.5) * 0.8;
      throttleCut = 0.6;
    }

    // Direção (proporcional, saturada).
    let steer = Math.max(-1, Math.min(1, diff * 2.2)) + errorSteer;
    steer = Math.max(-1, Math.min(1, steer));

    // ----- Acelerador: reduz em curvas fechadas -----
    const corner = Math.min(1, Math.abs(diff) / (Math.PI / 2));
    let throttle = (1 - corner * 0.65) * throttleCut;
    // Garante um mínimo para não parar.
    throttle = Math.max(0.25, throttle);

    this._controls = { throttle, steer };
    CarPhysics.step(this, this._controls, env);
  }
}

window.normalizeAngle = normalizeAngle;
window.AICar = AICar;
