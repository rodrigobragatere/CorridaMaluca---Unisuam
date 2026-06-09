/* ================================================================
   questions.js — Banco de perguntas sobre HTML (50+)
   Cada item: { q: enunciado, options: [4 strings], answer: índice (0-3) }
   Exposto globalmente como window.QUESTION_BANK e helper QuestionPool.
   ================================================================ */

const QUESTION_BANK = [
  { q: "Qual tag cria um hiperlink?", options: ["<img>", "<a>", "<table>", "<form>"], answer: 1 },
  { q: "Qual tag define um título principal?", options: ["<h1>", "<p>", "<span>", "<div>"], answer: 0 },
  { q: "Qual atributo define o endereço de um link?", options: ["src", "alt", "href", "class"], answer: 2 },
  { q: "Qual tag insere uma imagem?", options: ["<picture>", "<image>", "<img>", "<src>"], answer: 2 },
  { q: "Qual atributo define o caminho de uma imagem?", options: ["href", "src", "link", "path"], answer: 1 },
  { q: "Qual tag cria uma lista não ordenada?", options: ["<ol>", "<li>", "<ul>", "<list>"], answer: 2 },
  { q: "Qual tag cria uma lista ordenada?", options: ["<ul>", "<ol>", "<dl>", "<list>"], answer: 1 },
  { q: "Qual tag representa um item de lista?", options: ["<item>", "<li>", "<ul>", "<dt>"], answer: 1 },
  { q: "Qual tag define um parágrafo?", options: ["<par>", "<p>", "<text>", "<span>"], answer: 1 },
  { q: "Qual tag insere uma quebra de linha?", options: ["<break>", "<lb>", "<br>", "<hr>"], answer: 2 },
  { q: "Qual tag cria uma linha horizontal?", options: ["<line>", "<hr>", "<br>", "<rule>"], answer: 1 },
  { q: "Qual tag define uma tabela?", options: ["<grid>", "<table>", "<tab>", "<tr>"], answer: 1 },
  { q: "Qual tag define uma linha de tabela?", options: ["<td>", "<th>", "<tr>", "<row>"], answer: 2 },
  { q: "Qual tag define uma célula de dados na tabela?", options: ["<td>", "<tr>", "<th>", "<cell>"], answer: 0 },
  { q: "Qual tag define uma célula de cabeçalho na tabela?", options: ["<td>", "<th>", "<thead>", "<header>"], answer: 1 },
  { q: "Qual tag cria um formulário?", options: ["<input>", "<form>", "<field>", "<submit>"], answer: 1 },
  { q: "Qual tag cria um campo de entrada de dados?", options: ["<field>", "<entry>", "<input>", "<text>"], answer: 2 },
  { q: "Qual tag cria um botão clicável?", options: ["<btn>", "<button>", "<click>", "<a>"], answer: 1 },
  { q: "Qual atributo torna um campo obrigatório?", options: ["mandatory", "required", "needed", "must"], answer: 1 },
  { q: "Qual tag define o corpo do documento HTML?", options: ["<main>", "<content>", "<body>", "<html>"], answer: 2 },
  { q: "Qual tag contém metadados do documento?", options: ["<meta>", "<head>", "<info>", "<title>"], answer: 1 },
  { q: "Qual tag define o título exibido na aba do navegador?", options: ["<head>", "<h1>", "<title>", "<caption>"], answer: 2 },
  { q: "Qual a declaração correta de um documento HTML5?", options: ["<!DOCTYPE html>", "<doctype html5>", "<html5>", "<!HTML>"], answer: 0 },
  { q: "Qual tag agrupa conteúdo em bloco genérico?", options: ["<span>", "<div>", "<block>", "<group>"], answer: 1 },
  { q: "Qual tag agrupa conteúdo em linha (inline)?", options: ["<div>", "<inline>", "<span>", "<line>"], answer: 2 },
  { q: "Qual tag torna o texto em negrito (com importância)?", options: ["<b>", "<strong>", "<bold>", "<em>"], answer: 1 },
  { q: "Qual tag aplica ênfase (geralmente itálico)?", options: ["<i>", "<em>", "<italic>", "<emph>"], answer: 1 },
  { q: "Qual atributo define texto alternativo de uma imagem?", options: ["title", "src", "alt", "desc"], answer: 2 },
  { q: "Qual tag define a área de navegação?", options: ["<navigation>", "<menu>", "<nav>", "<links>"], answer: 2 },
  { q: "Qual tag define o rodapé de uma página?", options: ["<bottom>", "<footer>", "<foot>", "<end>"], answer: 1 },
  { q: "Qual tag define o cabeçalho de uma seção?", options: ["<head>", "<header>", "<top>", "<title>"], answer: 1 },
  { q: "Qual tag representa conteúdo principal da página?", options: ["<content>", "<main>", "<body>", "<section>"], answer: 1 },
  { q: "Qual tag define uma seção temática do documento?", options: ["<part>", "<area>", "<section>", "<block>"], answer: 2 },
  { q: "Qual tag define um artigo independente?", options: ["<post>", "<article>", "<text>", "<story>"], answer: 1 },
  { q: "Qual tag define conteúdo lateral (sidebar)?", options: ["<side>", "<aside>", "<bar>", "<extra>"], answer: 1 },
  { q: "Qual atributo identifica unicamente um elemento?", options: ["class", "name", "id", "key"], answer: 2 },
  { q: "Qual atributo agrupa elementos por estilo/classe?", options: ["id", "class", "group", "type"], answer: 1 },
  { q: "Como abrir um link em nova aba?", options: ["target=\"_blank\"", "new=\"tab\"", "open=\"new\"", "tab=\"new\""], answer: 0 },
  { q: "Qual tag insere uma lista de definições?", options: ["<dl>", "<def>", "<ul>", "<list>"], answer: 0 },
  { q: "Qual tag define um termo numa lista de definições?", options: ["<dd>", "<dt>", "<term>", "<li>"], answer: 1 },
  { q: "Qual tag insere conteúdo de vídeo?", options: ["<media>", "<movie>", "<video>", "<player>"], answer: 2 },
  { q: "Qual tag insere conteúdo de áudio?", options: ["<sound>", "<audio>", "<music>", "<media>"], answer: 1 },
  { q: "Qual tag permite desenho gráfico via JavaScript?", options: ["<draw>", "<canvas>", "<svg>", "<graphic>"], answer: 1 },
  { q: "Qual tag cria uma lista suspensa (dropdown)?", options: ["<dropdown>", "<list>", "<select>", "<option>"], answer: 2 },
  { q: "Qual tag define cada opção de um <select>?", options: ["<item>", "<option>", "<li>", "<opt>"], answer: 1 },
  { q: "Qual tag cria uma área de texto multilinha?", options: ["<textarea>", "<input>", "<text>", "<multiline>"], answer: 0 },
  { q: "Qual atributo define o tipo de um <input>?", options: ["kind", "type", "mode", "format"], answer: 1 },
  { q: "Qual valor de type cria uma caixa de seleção?", options: ["check", "checkbox", "select", "tick"], answer: 1 },
  { q: "Qual valor de type cria um botão de opção?", options: ["option", "radio", "select", "choice"], answer: 1 },
  { q: "Qual tag associa um rótulo a um campo de formulário?", options: ["<label>", "<title>", "<name>", "<text>"], answer: 0 },
  { q: "Qual atributo define o texto de dica em um input?", options: ["hint", "placeholder", "default", "tip"], answer: 1 },
  { q: "Qual tag externa o CSS no <head>?", options: ["<style>", "<css>", "<link>", "<script>"], answer: 2 },
  { q: "Qual tag inclui um arquivo JavaScript?", options: ["<js>", "<script>", "<code>", "<link>"], answer: 1 },
  { q: "Qual tag define texto pré-formatado?", options: ["<pre>", "<format>", "<code>", "<text>"], answer: 0 },
  { q: "Qual tag exibe trecho de código?", options: ["<pre>", "<code>", "<source>", "<dev>"], answer: 1 },
  { q: "Qual atributo mescla colunas de uma célula?", options: ["merge", "colspan", "span", "cols"], answer: 1 },
  { q: "Qual atributo mescla linhas de uma célula?", options: ["rowspan", "rowmerge", "rows", "span"], answer: 0 },
  { q: "Qual tag agrupa o cabeçalho de uma tabela?", options: ["<header>", "<thead>", "<top>", "<th>"], answer: 1 },
  { q: "Qual tag agrupa o corpo de uma tabela?", options: ["<body>", "<content>", "<tbody>", "<main>"], answer: 2 },
  { q: "Qual tag insere uma imagem responsiva com fontes múltiplas?", options: ["<picture>", "<img>", "<srcset>", "<media>"], answer: 0 },
  { q: "Qual entidade HTML representa o símbolo &?", options: ["&and;", "&amp;", "&e;", "&&;"], answer: 1 },
  { q: "Qual entidade representa um espaço inquebrável?", options: ["&space;", "&nbsp;", "&sp;", "&blank;"], answer: 1 },
  { q: "Qual tag marca texto destacado/realçado?", options: ["<mark>", "<hl>", "<high>", "<color>"], answer: 0 },
  { q: "Qual tag indica texto pequeno (legal)?", options: ["<small>", "<tiny>", "<sub>", "<mini>"], answer: 0 }
];

/* ----------------------------------------------------------------
   QuestionPool: fornece perguntas aleatórias SEM repetição.
   Quando todas forem usadas, o pool é reembaralhado.
   ---------------------------------------------------------------- */
const QuestionPool = {
  remaining: [],

  // Embaralha (Fisher-Yates) uma cópia dos índices disponíveis.
  reset() {
    this.remaining = QUESTION_BANK.map((_, i) => i);
    for (let i = this.remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
    }
  },

  // Retorna a próxima pergunta sem repetir até esgotar o banco.
  next() {
    if (this.remaining.length === 0) this.reset();
    const idx = this.remaining.pop();
    return QUESTION_BANK[idx];
  }
};

// Inicializa o pool no carregamento.
QuestionPool.reset();

window.QUESTION_BANK = QUESTION_BANK;
window.QuestionPool = QuestionPool;
