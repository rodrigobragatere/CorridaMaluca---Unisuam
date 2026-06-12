/* ================================================================
   api/ranking.js — Vercel Serverless Function (Node, CommonJS).
   Endpoint do ranking global do Tech Formula Race.

     GET    /api/ranking         -> retorna o TOP 10
     POST   /api/ranking         -> adiciona um resultado e retorna o TOP 10
     DELETE /api/ranking         -> limpa o ranking

   Persistência:
     - Usa Vercel KV / Upstash Redis (via REST) quando as variáveis de
       ambiente estiverem configuradas (KV_REST_API_URL + KV_REST_API_TOKEN
       ou UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
     - Caso contrário, cai em um armazenamento em memória (não persiste
       entre cold starts) — útil para testes. O cliente sempre mantém
       um espelho em LocalStorage como fallback offline.

   Sem dependências externas (usa apenas o fetch nativo do Node 18+).
   ================================================================ */

const MAX = 10;
const REDIS_KEY = "tfr:ranking";

// Dados iniciais (mesmo seed do cliente): usados apenas quando o ranking
// nunca foi gravado. Após "Limpar Ranking" (DELETE) a lista fica vazia
// e NÃO é semeada de novo, pois passa a existir como "[]".
const SEED = [
  { id: "seed-1", name: "Rodrigo",           position: 1, timeSec: 252, timeStr: "04:12", score: 1500, correct: 9, bestLap: 48 },
  { id: "seed-2", name: "SpeedRacer",        position: 2, timeSec: 265, timeStr: "04:25", score: 1320, correct: 8, bestLap: 51 },
  { id: "seed-3", name: "Penélope Charmosa", position: 3, timeSec: 278, timeStr: "04:38", score: 1180, correct: 7, bestLap: 53 },
  { id: "seed-4", name: "DickVigarista",     position: 4, timeSec: 291, timeStr: "04:51", score: 950,  correct: 6, bestLap: 55 },
  { id: "seed-5", name: "CComp",             position: 5, timeSec: 300, timeStr: "05:00", score: 820,  correct: 5, bestLap: 58 }
];

// Armazenamento em memória (fallback quando não há KV configurado).
// null = nunca inicializado (recebe o seed no primeiro acesso).
let memory = null;

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV = !!(KV_URL && KV_TOKEN);

// Executa um comando Redis via REST (formato Upstash: array no corpo).
async function redis(cmd) {
  const r = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error("KV error " + r.status);
  return r.json(); // { result: ... }
}

async function readRanking() {
  if (!hasKV) {
    if (memory === null) memory = SEED.slice();
    return memory.slice();
  }
  try {
    const data = await redis(["GET", REDIS_KEY]);
    if (!data || data.result == null) {
      // Chave inexistente: ranking nunca foi gravado -> semeia o Top 5.
      await writeRanking(SEED);
      return SEED.slice();
    }
    return JSON.parse(data.result);
  } catch (e) {
    return [];
  }
}

async function writeRanking(list) {
  if (!hasKV) { memory = list.slice(); return; }
  await redis(["SET", REDIS_KEY, JSON.stringify(list)]);
}

// Ordena: 1º pontuação (desc), 2º posição (asc), 3º tempo total (asc).
function sortList(list) {
  return list.sort((a, b) => {
    const scoreA = Number(a.score) || 0;
    const scoreB = Number(b.score) || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    if (a.position !== b.position) return a.position - b.position;
    return a.timeSec - b.timeSec;
  });
}

// Sanitiza o registro recebido do cliente.
function sanitize(body) {
  if (!body || typeof body !== "object") return null;
  const name = String(body.name || "Piloto").slice(0, 18).trim() || "Piloto";
  const position = Math.max(1, Math.min(99, parseInt(body.position, 10) || 99));
  const timeSec = Math.max(0, Number(body.timeSec) || 0);
  const score = Math.max(0, parseInt(body.score, 10) || 0);
  const correct = Math.max(0, parseInt(body.correct, 10) || 0);
  const bestLap = body.bestLap == null ? null : Number(body.bestLap);
  const timeStr = String(body.timeStr || "").slice(0, 8) || formatTime(timeSec);
  const id = String(body.id || (Date.now() + "-" + Math.random().toString(36).slice(2, 8))).slice(0, 40);
  return { id, name, position, timeSec, timeStr, score, correct, bestLap };
}

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

module.exports = async (req, res) => {
  // CORS (permite uso a partir de outras origens, se necessário).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  try {
    if (req.method === "GET") {
      const list = sortList(await readRanking()).slice(0, MAX);
      res.status(200).json({ ranking: list, storage: hasKV ? "kv" : "memory" });
      return;
    }

    if (req.method === "POST") {
      // O corpo pode vir como objeto (parse automático) ou string.
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      const record = sanitize(body);
      if (!record) { res.status(400).json({ error: "Registro inválido" }); return; }

      const list = await readRanking();
      list.push(record);
      sortList(list);
      const trimmed = list.slice(0, MAX);
      await writeRanking(trimmed);

      res.status(200).json({ ranking: trimmed, id: record.id, storage: hasKV ? "kv" : "memory" });
      return;
    }

    if (req.method === "DELETE") {
      await writeRanking([]);
      res.status(200).json({ ranking: [], storage: hasKV ? "kv" : "memory" });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (e) {
    res.status(500).json({ error: "Erro interno", detail: String(e && e.message || e) });
  }
};
