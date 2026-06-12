/* ================================================================
   questions.js — Banco de perguntas sobre HTML, CSS e JavaScript
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
  { q: "Qual tag indica texto pequeno (legal)?", options: ["<small>", "<tiny>", "<sub>", "<mini>"], answer: 0 },

  /* ---------------- CSS (50 questões) ---------------- */
  { q: "O que significa CSS?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"], answer: 1 },
  { q: "Qual propriedade altera a cor do texto?", options: ["text-color", "font-color", "color", "text-style"], answer: 2 },
  { q: "Qual propriedade altera a cor de fundo?", options: ["bgcolor", "background-color", "color-back", "fill"], answer: 1 },
  { q: "Como selecionar um elemento com id 'menu'?", options: [".menu", "#menu", "*menu", "menu()"], answer: 1 },
  { q: "Como selecionar elementos com a classe 'box'?", options: ["#box", "box", ".box", "*box"], answer: 2 },
  { q: "Qual propriedade define o tamanho da fonte?", options: ["font-size", "text-size", "font-style", "size"], answer: 0 },
  { q: "Qual propriedade deixa o texto em negrito?", options: ["font-style", "text-weight", "font-weight", "bold"], answer: 2 },
  { q: "Qual valor de font-style deixa o texto em itálico?", options: ["bold", "italic", "oblique-text", "cursive"], answer: 1 },
  { q: "Qual propriedade centraliza o texto horizontalmente?", options: ["align", "text-align", "horizontal-align", "center"], answer: 1 },
  { q: "Qual propriedade adiciona espaço interno ao elemento?", options: ["margin", "spacing", "padding", "border"], answer: 2 },
  { q: "Qual propriedade adiciona espaço externo ao elemento?", options: ["padding", "margin", "gap", "outline"], answer: 1 },
  { q: "Qual propriedade define a borda de um elemento?", options: ["outline", "border", "edge", "frame"], answer: 1 },
  { q: "Qual propriedade arredonda os cantos de um elemento?", options: ["corner-style", "border-radius", "round-corner", "corner-radius"], answer: 1 },
  { q: "Como aplicar CSS diretamente em uma tag HTML?", options: ["atributo style", "atributo css", "tag <style>", "atributo design"], answer: 0 },
  { q: "Qual tag insere CSS interno no documento?", options: ["<css>", "<script>", "<style>", "<design>"], answer: 2 },
  { q: "Qual propriedade controla a transparência de um elemento?", options: ["visibility", "opacity", "transparent", "alpha"], answer: 1 },
  { q: "Qual valor de display esconde um elemento sem ocupar espaço?", options: ["hidden", "invisible", "none", "collapse"], answer: 2 },
  { q: "Qual propriedade define um layout flexível?", options: ["display: flex", "layout: flex", "flex: display", "position: flex"], answer: 0 },
  { q: "No flexbox, qual propriedade alinha itens no eixo principal?", options: ["align-items", "justify-content", "align-content", "flex-align"], answer: 1 },
  { q: "No flexbox, qual propriedade alinha itens no eixo transversal?", options: ["justify-content", "align-items", "text-align", "vertical-align"], answer: 1 },
  { q: "Qual propriedade cria um layout de grade?", options: ["display: table", "display: grid", "display: layout", "grid: on"], answer: 1 },
  { q: "Qual propriedade define as colunas de um grid?", options: ["grid-columns", "columns", "grid-template-columns", "template-columns"], answer: 2 },
  { q: "Qual unidade é relativa ao tamanho da fonte do elemento raiz?", options: ["em", "px", "rem", "%"], answer: 2 },
  { q: "Qual unidade representa porcentagem da largura da viewport?", options: ["vw", "vh", "wv", "pw"], answer: 0 },
  { q: "Qual pseudo-classe aplica estilo quando o mouse passa sobre o elemento?", options: [":focus", ":active", ":hover", ":over"], answer: 2 },
  { q: "Qual pseudo-classe seleciona o primeiro filho de um elemento?", options: [":first", ":first-child", ":child(1)", ":start"], answer: 1 },
  { q: "Qual valor de position fixa o elemento em relação à viewport?", options: ["absolute", "relative", "fixed", "static"], answer: 2 },
  { q: "Qual valor de position posiciona em relação ao ancestral posicionado?", options: ["absolute", "fixed", "static", "relative"], answer: 0 },
  { q: "Qual propriedade controla a sobreposição de elementos?", options: ["layer", "z-index", "depth", "stack"], answer: 1 },
  { q: "Qual propriedade adiciona sombra a uma caixa?", options: ["shadow", "box-shadow", "element-shadow", "drop-shadow"], answer: 1 },
  { q: "Qual propriedade adiciona sombra ao texto?", options: ["font-shadow", "text-shadow", "shadow-text", "letter-shadow"], answer: 1 },
  { q: "O que é usado para criar designs responsivos?", options: ["media queries", "scripts", "frames", "tables"], answer: 0 },
  { q: "Qual a sintaxe correta de uma media query?", options: ["@media (max-width: 600px)", "@query (width < 600)", "@screen 600px", "@media-width: 600px"], answer: 0 },
  { q: "Qual propriedade altera o tipo de fonte?", options: ["font-type", "font-family", "typeface", "text-font"], answer: 1 },
  { q: "Qual propriedade define o espaçamento entre linhas?", options: ["line-spacing", "line-height", "text-spacing", "leading"], answer: 1 },
  { q: "Qual propriedade define o espaçamento entre letras?", options: ["letter-spacing", "char-spacing", "text-spacing", "font-spacing"], answer: 0 },
  { q: "Como remover o sublinhado de um link?", options: ["underline: none", "text-decoration: none", "link-style: none", "decoration: off"], answer: 1 },
  { q: "Qual propriedade transforma texto em maiúsculas?", options: ["text-style: caps", "font-case: upper", "text-transform: uppercase", "uppercase: true"], answer: 2 },
  { q: "Qual seletor aplica estilo a TODOS os elementos?", options: ["#all", ".all", "*", "all"], answer: 2 },
  { q: "Qual propriedade define a largura de um elemento?", options: ["size", "width", "length", "wide"], answer: 1 },
  { q: "Qual propriedade define a altura de um elemento?", options: ["height", "size", "tall", "vertical"], answer: 0 },
  { q: "Qual propriedade limita a largura máxima?", options: ["width-max", "max-width", "limit-width", "width-limit"], answer: 1 },
  { q: "Qual valor de overflow adiciona barra de rolagem quando necessário?", options: ["scroll", "auto", "visible", "hidden"], answer: 1 },
  { q: "Qual propriedade cria transições suaves entre estados?", options: ["animation", "transition", "transform", "motion"], answer: 1 },
  { q: "Qual propriedade rotaciona, escala ou move um elemento?", options: ["transition", "translate", "transform", "animate"], answer: 2 },
  { q: "Qual regra define uma animação em CSS?", options: ["@animation", "@keyframes", "@frames", "@motion"], answer: 1 },
  { q: "Qual propriedade muda o cursor do mouse?", options: ["mouse", "pointer", "cursor", "hover"], answer: 2 },
  { q: "Como declarar uma variável CSS?", options: ["--cor: red;", "$cor: red;", "@cor: red;", "var cor = red;"], answer: 0 },
  { q: "Como usar uma variável CSS?", options: ["get(--cor)", "var(--cor)", "use(--cor)", "$(--cor)"], answer: 1 },
  { q: "O que define a especificidade mais alta entre seletores?", options: ["classe", "tag", "id", "atributo"], answer: 2 },

  /* ---------------- JavaScript (50 questões) ---------------- */
  { q: "Qual palavra-chave declara uma variável que pode mudar de valor?", options: ["const", "let", "static", "define"], answer: 1 },
  { q: "Qual palavra-chave declara uma constante?", options: ["let", "var", "const", "final"], answer: 2 },
  { q: "Qual operador compara valor E tipo?", options: ["==", "=", "===", "!="], answer: 2 },
  { q: "Qual função exibe uma mensagem no console?", options: ["print()", "console.log()", "alert.log()", "echo()"], answer: 1 },
  { q: "Qual função exibe uma caixa de alerta no navegador?", options: ["msg()", "prompt()", "alert()", "popup()"], answer: 2 },
  { q: "Como se declara uma função em JavaScript?", options: ["function minhaFunc() {}", "def minhaFunc() {}", "func minhaFunc() {}", "fn minhaFunc() {}"], answer: 0 },
  { q: "Qual a sintaxe de uma arrow function?", options: ["() => {}", "() -> {}", "=> () {}", "function => {}"], answer: 0 },
  { q: "Qual método adiciona um item ao FINAL de um array?", options: ["add()", "append()", "push()", "insert()"], answer: 2 },
  { q: "Qual método remove o ÚLTIMO item de um array?", options: ["pop()", "remove()", "delete()", "shift()"], answer: 0 },
  { q: "Qual método remove o PRIMEIRO item de um array?", options: ["pop()", "shift()", "unshift()", "first()"], answer: 1 },
  { q: "Qual propriedade retorna o tamanho de um array?", options: ["size", "count", "length", "total"], answer: 2 },
  { q: "Qual método percorre um array executando uma função?", options: ["forEach()", "loop()", "each()", "iterate()"], answer: 0 },
  { q: "Qual método cria um NOVO array transformando cada item?", options: ["filter()", "map()", "reduce()", "transform()"], answer: 1 },
  { q: "Qual método filtra itens de um array por condição?", options: ["map()", "select()", "filter()", "where()"], answer: 2 },
  { q: "Qual método converte string para número inteiro?", options: ["toInt()", "parseInt()", "Number.int()", "intValue()"], answer: 1 },
  { q: "Qual método converte um objeto em texto JSON?", options: ["JSON.parse()", "JSON.text()", "JSON.stringify()", "JSON.convert()"], answer: 2 },
  { q: "Qual método converte texto JSON em objeto?", options: ["JSON.parse()", "JSON.stringify()", "JSON.object()", "JSON.read()"], answer: 0 },
  { q: "Qual operador retorna o resto de uma divisão?", options: ["/", "%", "//", "mod"], answer: 1 },
  { q: "Qual o resultado de typeof 'texto'?", options: ["text", "string", "char", "word"], answer: 1 },
  { q: "Qual o resultado de typeof 42?", options: ["int", "float", "number", "digit"], answer: 2 },
  { q: "Qual valor representa 'ausência intencional de valor'?", options: ["undefined", "null", "NaN", "void"], answer: 1 },
  { q: "O que significa NaN?", options: ["Not a Number", "No assigned Name", "New and Null", "Negative Number"], answer: 0 },
  { q: "Como selecionar um elemento pelo id no DOM?", options: ["document.getElementById()", "document.findId()", "document.id()", "getElement()"], answer: 0 },
  { q: "Qual método seleciona o PRIMEIRO elemento por seletor CSS?", options: ["document.select()", "document.querySelector()", "document.getCSS()", "document.find()"], answer: 1 },
  { q: "Qual método seleciona TODOS os elementos por seletor CSS?", options: ["querySelectorAll()", "selectAll()", "getElements()", "queryAll()"], answer: 0 },
  { q: "Qual propriedade altera o texto de um elemento?", options: ["element.text", "element.textContent", "element.value()", "element.write"], answer: 1 },
  { q: "Qual propriedade altera o HTML interno de um elemento?", options: ["innerText", "htmlContent", "innerHTML", "content"], answer: 2 },
  { q: "Qual método adiciona um ouvinte de evento?", options: ["addEventListener()", "onEvent()", "attachEvent()", "listen()"], answer: 0 },
  { q: "Qual evento dispara ao clicar em um elemento?", options: ["press", "click", "tap", "select"], answer: 1 },
  { q: "Qual evento dispara quando a página termina de carregar?", options: ["start", "ready", "load", "open"], answer: 2 },
  { q: "Qual método executa uma função após um tempo (uma vez)?", options: ["setInterval()", "setTimeout()", "delay()", "wait()"], answer: 1 },
  { q: "Qual método executa uma função repetidamente em intervalos?", options: ["setTimeout()", "setLoop()", "setInterval()", "repeat()"], answer: 2 },
  { q: "Qual estrutura repete um bloco enquanto a condição for verdadeira?", options: ["if", "while", "switch", "case"], answer: 1 },
  { q: "Qual estrutura escolhe entre múltiplos casos?", options: ["if-list", "switch", "select", "match-all"], answer: 1 },
  { q: "Como se escreve um comentário de uma linha?", options: ["<!-- comentário -->", "# comentário", "// comentário", "** comentário"], answer: 2 },
  { q: "Como se escreve um comentário de múltiplas linhas?", options: ["/* ... */", "// ... //", "<!-- ... -->", "## ... ##"], answer: 0 },
  { q: "Qual operador lógico representa 'E'?", options: ["||", "&&", "&", "AND"], answer: 1 },
  { q: "Qual operador lógico representa 'OU'?", options: ["&&", "|", "||", "OR"], answer: 2 },
  { q: "Qual operador nega uma expressão booleana?", options: ["~", "!", "not", "^"], answer: 1 },
  { q: "Como interpolar variáveis em uma template string?", options: ["'Olá ${nome}'", "`Olá ${nome}`", "\"Olá #{nome}\"", "`Olá {{nome}}`"], answer: 1 },
  { q: "Qual método junta os itens de um array em uma string?", options: ["concat()", "join()", "merge()", "glue()"], answer: 1 },
  { q: "Qual método divide uma string em um array?", options: ["split()", "divide()", "slice()", "cut()"], answer: 0 },
  { q: "Qual método transforma uma string em MAIÚSCULAS?", options: ["toCaps()", "upper()", "toUpperCase()", "capitalize()"], answer: 2 },
  { q: "Qual objeto gera números aleatórios?", options: ["Math.rand()", "Math.random()", "Number.random()", "Random.get()"], answer: 1 },
  { q: "Qual método arredonda um número para BAIXO?", options: ["Math.round()", "Math.ceil()", "Math.floor()", "Math.down()"], answer: 2 },
  { q: "O que retorna uma função sem return explícito?", options: ["null", "0", "undefined", "false"], answer: 2 },
  { q: "Qual palavra-chave pausa uma função async até a Promise resolver?", options: ["wait", "await", "pause", "hold"], answer: 1 },
  { q: "Como declarar uma função assíncrona?", options: ["async function f() {}", "await function f() {}", "function async f() {}", "promise function f() {}"], answer: 0 },
  { q: "Qual método trata erros em uma Promise?", options: [".error()", ".catch()", ".fail()", ".reject()"], answer: 1 },
  { q: "Qual API do navegador faz requisições HTTP?", options: ["http()", "request()", "fetch()", "ajax()"], answer: 2 }
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
