import hljs from "highlight.js";

// Language patterns for detection
const languagePatterns: Record<string, RegExp[]> = {
  python: [
    /^(import|from)\s+\w+/m,
    /^(def|class)\s+\w+/m,
    /print\s*\(/,
    /:\s*$/m,
    /if\s+.+\s*:/,
    /for\s+\w+\s+in\s+/,
  ],
  javascript: [
    /^(const|let|var)\s+\w+\s*=/m,
    /function\s*\(/,
    /=>\s*\{/,
    /console\.log\(/,
    /^(export|import)\s+/m,
    /document\.(getElementById|querySelector)/,
  ],
  typescript: [
    /:\s*(string|number|boolean|any|void)\s*[;=)]/,
    /interface\s+\w+\s*\{/,
    /type\s+\w+\s*=/,
    /<(T|K|V|E)\s*(extends)?/,
    /as\s+(string|number|const)/,
  ],
  css: [
    /[.#]\w+\s*\{/,
    /@media\s+/,
    /:\s*\w+\s*;/,
    /-(webkit|moz|ms)-/,
    /^(html|body|div|span|p|a)\s*\{/m,
  ],
  json: [
    /^\s*[\{\[]/,
    /"\w+"\s*:\s*("[^"]*"|\d+|true|false|null)/,
    /^\s*\{[\s\S]*\}\s*$/,
  ],
  html: [
    /<\w+[^>]*>/,
    /<\/\w+>/,
    /<!DOCTYPE/i,
    /<html[^>]*>/i,
  ],
  sql: [
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/im,
    /FROM\s+\w+/i,
    /WHERE\s+\w+/i,
    /JOIN\s+\w+\s+ON/i,
  ],
  java: [
    /^(public|private|protected)\s+(class|void|static)/m,
    /System\.out\.println/,
    /extends\s+\w+/,
    /implements\s+\w+/,
  ],
  cpp: [
    /#include\s*</,
    /^(int|void|bool|char|double|float|auto)\s+\w+\s*\(/m,
    /std::/,
    /cout\s*<</,
    /cin\s*>>/,
  ],
  rust: [
    /^(fn|let|mut|pub|use|mod|impl|struct|enum|trait)\s+/m,
    /->\s*\w+\s*\{/,
    /match\s+\w+\s*\{/,
    /println!/,
    /Result<|Option</,
  ],
  go: [
    /^(func|var|const|type|import|package)\s+/m,
    /:=\s*/,
    /fmt\.Print/,
    /chan\s+\w+/,
    /goroutine/,
  ],
  ruby: [
    /^(def|class|module|require|include)\s+/m,
    /puts\s+/,
    /:\w+\s*=>/,
    /@\w+/,
    /do\s*\|[^|]+\|/,
  ],
  php: [
    /<\?php/,
    /\$\w+/,
    /^(function|class|namespace)\s+/m,
    /echo\s+/,
    /\$_GET|\$_POST|\$_SERVER/,
  ],
  shell: [
    /^#!\/bin\/(bash|sh|zsh)/m,
    /^(export|source|alias|function)\s+/m,
    /\|\s*(grep|awk|sed|cat|echo)/,
    /\$\w+/,
    /&&\s*$/m,
  ],
  markdown: [
    /^#{1,6}\s+/m,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /\[([^\]]+)\]\(([^)]+)\)/,
    /`{3}\w*/,
  ],
  yaml: [
    /^\w+:\s*$/m,
    /^\s+-\s+/m,
    /:\s*\w+\s*$/m,
  ],
  xml: [
    /<\?xml/,
    /<\w+[^>]*\/>/,
    /<\!\[CDATA\[/,
  ],
};

/**
 * Detect programming language from code content
 * Returns the detected language or 'plaintext' if no match
 */
export function detectLanguage(code: string): string {
  if (!code || code.trim().length === 0) {
    return "plaintext";
  }

  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    scores[lang] = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        scores[lang]++;
      }
    }
  }

  // Find the language with the highest score
  let bestMatch = "plaintext";
  let highestScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = lang;
    }
  }

  // Require at least 2 pattern matches for confidence
  return highestScore >= 2 ? bestMatch : "plaintext";
}

/**
 * Format language name for display
 */
export function formatLanguageName(lang: string): string {
  const names: Record<string, string> = {
    python: "Python",
    javascript: "JavaScript",
    typescript: "TypeScript",
    css: "CSS",
    json: "JSON",
    html: "HTML",
    sql: "SQL",
    java: "Java",
    cpp: "C++",
    rust: "Rust",
    go: "Go",
    ruby: "Ruby",
    php: "PHP",
    shell: "Shell",
    markdown: "Markdown",
    yaml: "YAML",
    xml: "XML",
    plaintext: "Plain Text",
  };
  return names[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}
