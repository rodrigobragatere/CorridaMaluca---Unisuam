/* ================================================================
   player.js — Física de carro compartilhada + classe do jogador.
   - CarPhysics.step(): física comum usada por jogador e IA.
   - Player: lê o input do teclado/touch e aplica a física.
   Exposto como window.CarPhysics e window.Player.
   ================================================================ */

/* ----------------------------------------------------------------
   Constantes globais de física (px/s). Ajustáveis para o "feel".
   ---------------------------------------------------------------- */
const PHYS = {
  baseMaxSpeed: 360,    // velocidade máxima normal
  accel: 320,           // aceleração
  brakeForce: 520,      // frenagem
  reverseMax: 120,      // velocidade máxima de ré
  friction: 0.8,        // atrito natural (fração/s)
  offTrackFriction: 3.2,// atrito extra fora da pista
  offTrackMaxFactor: 0.45, // limite de velocidade fora da pista
  turnRate: 3.0,        // rad/s de viragem (em velocidade ideal)
  nitroFactor: 1.6,     // multiplicador de vel. máx no nitro
  nitroAccel: 1.8,      // multiplicador de aceleração no nitro
  penaltyFactor: 0.7    // -30% de velocidade na penalidade
};

const CarPhysics = {
  PHYS,

  /*
    Avança a física de um carro.
    car: { x, y, angle, speed, maxSpeed, nitroTime, penaltyTime }
    controls: { throttle: -1..1, steer: -1..1 }
    env: { dt, onTrack: bool }
  */
  step(car, controls, env) {
    const dt = env.dt;

    // Atualiza temporizadores de status (nitro / penalidade).
    if (car.nitroTime > 0) car.nitroTime = Math.max(0, car.nitroTime - dt);
    if (car.penaltyTime > 0) car.penaltyTime = Math.max(0, car.penaltyTime - dt);

    const nitroActive = car.nitroTime > 0;
    const penaltyActive = car.penaltyTime > 0;

    // Velocidade máxima efetiva.
    let maxSpeed = car.maxSpeed;
    if (nitroActive) maxSpeed *= PHYS.nitroFactor;
    if (penaltyActive) maxSpeed *= PHYS.penaltyFactor;
    if (!env.onTrack) maxSpeed *= PHYS.offTrackMaxFactor;

    // Aceleração / frenagem.
    const accel = PHYS.accel * (nitroActive ? PHYS.nitroAccel : 1);
    const t = controls.throttle;
    if (t > 0) {
      car.speed += accel * t * dt;
    } else if (t < 0) {
      // Freia se andando para frente, senão dá ré.
      if (car.speed > 0) car.speed += -PHYS.brakeForce * dt;
      else car.speed += -PHYS.accel * dt;
    }

    // Atrito (natural + fora da pista).
    let fr = PHYS.friction + (env.onTrack ? 0 : PHYS.offTrackFriction);
    car.speed -= car.speed * fr * dt;

    // Limites de velocidade.
    if (car.speed > maxSpeed) car.speed = maxSpeed;
    if (car.speed < -PHYS.reverseMax) car.speed = -PHYS.reverseMax;
    if (Math.abs(car.speed) < 1) car.speed = 0;

    // Viragem: proporcional à velocidade (não vira parado).
    const speedFactor = Math.max(-1, Math.min(1, car.speed / car.maxSpeed));
    car.angle += controls.steer * PHYS.turnRate * speedFactor * dt;

    // Integra a posição na direção do carro.
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;

    car.nitroActive = nitroActive;
    car.penaltyActive = penaltyActive;
  },

  // Ativa nitro por uma duração (s).
  activateNitro(car, seconds) { car.nitroTime = seconds; car.penaltyTime = 0; },

  // Aplica penalidade por uma duração (s).
  applyPenalty(car, seconds) { car.penaltyTime = seconds; },

  // Velocidade em "km/h" (escala arbitrária para exibição).
  toKmh(car) { return Math.round(Math.abs(car.speed) * 0.8); }
};

/* ================================================================
   Player — controlado pelo usuário.
   ================================================================ */
class Player {
  constructor(x, y, angle, name, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 0;
    this.maxSpeed = PHYS.baseMaxSpeed;

    this.name = name;
    this.color = color || "#00f0ff";
    this.isPlayer = true;

    // Status
    this.nitroTime = 0;
    this.penaltyTime = 0;
    this.nitroActive = false;
    this.penaltyActive = false;

    // Progresso de corrida (preenchido pelo game.js)
    this.lap = 0;
    this.checkpoint = 0;
    this.progress = 0;       // distância acumulada ao longo da pista
    this.finished = false;
    this.position = 1;
    this.lastLapTime = 0;
    this.bestLap = Infinity;
    this.lapStart = 0;
    this.overtakes = 0;
  }

  /*
    Atualiza o jogador a partir do estado de input.
    input: { up, down, left, right } (booleans) + analógico opcional
    analog: { steer, throttle } quando vindo do joystick (-1..1)
  */
  update(env, input, analog) {
    let throttle = 0, steer = 0;

    if (analog && analog.active) {
      throttle = analog.throttle;
      steer = analog.steer;
    } else {
      if (input.up) throttle += 1;
      if (input.down) throttle -= 1;
      if (input.left) steer -= 1;
      if (input.right) steer += 1;
    }

    this._controls = { throttle, steer };
    CarPhysics.step(this, this._controls, env);
  }
}

window.PHYS = PHYS;
window.CarPhysics = CarPhysics;
window.Player = Player;
