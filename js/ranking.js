/* ================================================================
   ranking.js — Persistência do ranking.
   Estratégia híbrida:
     1) Tenta usar a API serverless (Vercel Functions) em /api/ranking
        para um ranking GLOBAL compartilhado entre jogadores.
     2) Sempre mantém um espelho local em LocalStorage como fallback
        (funciona offline / abrindo via file://).
   Ordenação:
     1º critério: maior pontuação (score)
     2º critério: posição final obtida (menor é melhor)
     3º critério: menor tempo total
   Quem fizer mais pontos ultrapassa os demais no ranking, e a lista
   permanece salva (LocalStorage / servidor). Mantém apenas o TOP 10.
   Exposto como window.Ranking.
   ================================================================ */

const Ranking = (() => {
  const KEY = "tech_formula_race_ranking_v1";
  const API = "/api/ranking";
  const MAX = 10;

  /* ---------------- Dados iniciais (seed do Top 5) ---------------- */
  // Registros padrão exibidos enquanto ninguém jogou ainda.
  const SEED = [
    { id: "seed-1", name: "Rodrigo",           position: 1, timeSec: 252, timeStr: "04:12", score: 1500, correct: 9, bestLap: 48 },
    { id: "seed-2", name: "SpeedRacer",        position: 2, timeSec: 265, timeStr: "04:25", score: 1320, correct: 8, bestLap: 51 },
    { id: "seed-3", name: "Penélope Charmosa", position: 3, timeSec: 278, timeStr: "04:38", score: 1180, correct: 7, bestLap: 53 },
    { id: "seed-4", name: "DickVigarista",     position: 4, timeSec: 291, timeStr: "04:51", score: 950,  correct: 6, bestLap: 55 },
    { id: "seed-5", name: "CComp",             position: 5, timeSec: 300, timeStr: "05:00", score: 820,  correct: 5, bestLap: 58 }
  ];

  /* ---------------- LocalStorage (espelho/fallback) ---------------- */
  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  function saveLocal(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  // Semeia o ranking inicial apenas se nunca houve registro salvo
  // (não recria após o jogador usar "Limpar Ranking").
  try {
    if (localStorage.getItem(KEY) === null) saveLocal(SEED);
  } catch (e) {}

  function sortList(list) {
    return list.sort((a, b) => {
      const scoreA = Number(a.score) || 0;
      const scoreB = Number(b.score) || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;        // maior pontuação primeiro
      if (a.position !== b.position) return a.position - b.position;
      return a.timeSec - b.timeSec;
    });
  }

  function addLocal(record) {
    const list = loadLocal();
    list.push(record);
    sortList(list);
    const trimmed = list.slice(0, MAX);
    saveLocal(trimmed);
    return trimmed;
  }

  /* ---------------- API serverless ---------------- */
  // timeout simples para não travar a tela final caso a API demore.
  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
    ]);
  }

  async function fetchServer() {
    const r = await withTimeout(fetch(API, { method: "GET" }), 4000);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    return data.ranking || [];
  }

  async function postServer(record) {
    const r = await withTimeout(fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    }), 4000);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    return data.ranking || [];
  }

  /* ---------------- API pública ---------------- */
  /*
    add(record): grava no servidor (se disponível) e no espelho local.
    Retorna { list, rankIndex, online }.
    record deve conter um campo `id` único para localizar a posição.
  */
  async function add(record) {
    const localList = addLocal(record); // sempre garante o espelho local
    try {
      const serverList = await postServer(record);
      let idx = serverList.findIndex(r => r.id === record.id);
      return { list: serverList, rankIndex: idx, online: true };
    } catch (e) {
      const idx = localList.findIndex(r => r.id === record.id);
      return { list: localList, rankIndex: idx, online: false };
    }
  }

  // getTop10(): tenta servidor, cai no local.
  async function getTop10() {
    try {
      return { list: await fetchServer(), online: true };
    } catch (e) {
      return { list: sortList(loadLocal()).slice(0, MAX), online: false };
    }
  }

  // clear(): limpa local e tenta limpar o servidor.
  async function clear() {
    saveLocal([]);
    try { await withTimeout(fetch(API, { method: "DELETE" }), 4000); } catch (e) {}
  }

  return { add, getTop10, clear, loadLocal };
})();

window.Ranking = Ranking;
