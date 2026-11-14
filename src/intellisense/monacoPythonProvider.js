import {
  BUILTIN_DOCS,
  CS50P_SNIPPETS,
  MODULE_CATALOG,
  PYTHON_KEYWORDS,
  TYPE_METHODS
} from './pythonCatalog.js';

export function registerSabersThemes(monaco) {
  monaco.editor.defineTheme('sabers-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'EF3340', fontStyle: 'bold' },
      { token: 'string', foreground: '34D399' },
      { token: 'number', foreground: 'FBBF24' },
      { token: 'type.identifier', foreground: '38BDF8' },
      { token: 'identifier', foreground: 'F3F4F6' },
      { token: 'delimiter', foreground: '9CA3AF' }
    ],
    colors: {
      'editor.background': '#0E1117',
      'editor.foreground': '#F3F4F6',
      'editor.lineHighlightBackground': '#171C26',
      'editorCursor.foreground': '#EF3340',
      'editor.selectionBackground': '#EF334038',
      'editorLineNumber.foreground': '#4B5563',
      'editorLineNumber.activeForeground': '#EF3340',
      'editorSuggestWidget.background': '#11151D',
      'editorSuggestWidget.border': '#232936',
      'editorSuggestWidget.selectedBackground': '#EF334030',
      'editorHoverWidget.background': '#11151D',
      'editorHoverWidget.border': '#EF334066'
    }
  });

  monaco.editor.defineTheme('sabers-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'D92330', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'D97706' },
      { token: 'type.identifier', foreground: '0284C7' },
      { token: 'identifier', foreground: '0F172A' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#0F172A',
      'editor.lineHighlightBackground': '#F1F5F9',
      'editorCursor.foreground': '#D92330',
      'editor.selectionBackground': '#D9233025',
      'editorLineNumber.activeForeground': '#D92330',
      'editorHoverWidget.background': '#FFFFFF',
      'editorHoverWidget.border': '#D9233066'
    }
  });
}

export function extractLocalPythonSymbols(code) {
  const functions = [];
  const classes = [];
  const variables = new Set();
  const imports = new Map(); // alias -> realModuleOrSymbol

  const lines = code.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const fnMatch = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/);
    if (fnMatch) {
      const name = fnMatch[1];
      const params = fnMatch[2].trim();
      let doc = '';
      // Extract triple-quoted docstring on following line if present
      const next = lines[i + 1]?.trim() || '';
      const docMatch = next.match(/^(?:"""|''')(.+?)(?:"""|''')?$/);
      if (docMatch) doc = docMatch[1].replace(/(?:"""|''')$/, '').trim();
      functions.push({
        name,
        params,
        line: lineNum,
        signature: `${name}(${params})`,
        doc: doc || `User-defined function on line ${lineNum}.`
      });
      continue;
    }

    const clsMatch = line.match(/^\s*class\s+([A-Za-z_]\w*)(?:\(([^)]*)\))?/);
    if (clsMatch) {
      classes.push({
        name: clsMatch[1],
        bases: clsMatch[2] || '',
        line: lineNum
      });
      continue;
    }

    const impMatch = line.match(/^\s*import\s+([A-Za-z_][\w.]*)(?:\s+as\s+([A-Za-z_]\w*))?/);
    if (impMatch) {
      const mod = impMatch[1];
      const alias = impMatch[2] || mod.split('.')[0];
      imports.set(alias, mod);
      continue;
    }

    const fromImpMatch = line.match(/^\s*from\s+([A-Za-z_][\w.]*)\s+import\s+(.+)/);
    if (fromImpMatch) {
      const mod = fromImpMatch[1];
      for (const part of fromImpMatch[2].split(',')) {
        const cleaned = part.trim();
        const asMatch = cleaned.match(/^([A-Za-z_]\w*)(?:\s+as\s+([A-Za-z_]\w*))?/);
        if (asMatch) {
          imports.set(asMatch[2] || asMatch[1], `${mod}.${asMatch[1]}`);
        }
      }
      continue;
    }

    const assignMatch = line.match(/^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?=\s*(.+)/);
    if (assignMatch && !line.trimStart().startsWith('if ')) {
      variables.add(assignMatch[1]);
    }
  }

  return { functions, classes, variables: [...variables], imports };
}

function lookupSymbolDocumentation(word, chainPrefix, symbols) {
  // 1. Check module.member (e.g. sys.argv, csv.DictReader, emoji.emojize)
  if (chainPrefix) {
    const resolvedMod = symbols.imports.get(chainPrefix) || chainPrefix;
    const baseMod = resolvedMod.split('.')[0];
    const modInfo = MODULE_CATALOG[resolvedMod] || MODULE_CATALOG[baseMod];
    if (modInfo?.members?.[word]) {
      const m = modInfo.members[word];
      return {
        title: m.signature,
        body: m.doc
      };
    }

    // Check common str / list / dict / set methods
    for (const [typeName, methods] of Object.entries(TYPE_METHODS)) {
      if (methods[word]) {
        return {
          title: methods[word].signature,
          body: `${methods[word].doc}\n\n*Method on \`${typeName}\`*`
        };
      }
    }
  }

  // 2. Check imported alias directly (e.g. `from emoji import emojize` -> hovering `emojize`)
  if (symbols.imports.has(word)) {
    const target = symbols.imports.get(word);
    const parts = target.split('.');
    if (parts.length === 2 && MODULE_CATALOG[parts[0]]?.members?.[parts[1]]) {
      const m = MODULE_CATALOG[parts[0]].members[parts[1]];
      return { title: m.signature, body: m.doc };
    }
    if (MODULE_CATALOG[target]) {
      return { title: `module ${target}`, body: MODULE_CATALOG[target].doc };
    }
  }

  // 3. Check module name
  if (MODULE_CATALOG[word]) {
    return { title: `module ${word}`, body: MODULE_CATALOG[word].doc };
  }

  // 4. Check built-in functions
  if (BUILTIN_DOCS[word]) {
    const b = BUILTIN_DOCS[word];
    const ex = b.example ? `\n\n\`\`\`python\n${b.example}\n\`\`\`` : '';
    return { title: b.signature, body: `${b.doc}${ex}` };
  }

  // 5. Check user-defined functions/classes in current file
  const fn = symbols.functions.find((f) => f.name === word);
  if (fn) {
    return { title: `def ${fn.signature}`, body: fn.doc };
  }
  const cls = symbols.classes.find((c) => c.name === word);
  if (cls) {
    return { title: `class ${cls.name}${cls.bases ? `(${cls.bases})` : ''}`, body: `User-defined class on line ${cls.line}.` };
  }

  // 6. Fallback check if hovering a bare method name after a dot without prefix match
  for (const [typeName, methods] of Object.entries(TYPE_METHODS)) {
    if (methods[word]) {
      return { title: methods[word].signature, body: `${methods[word].doc} (*${typeName} method*)` };
    }
  }

  return null;
}

function findActiveCallContext(textBeforeCursor) {
  let depth = 0;
  let commaCount = 0;
  let inString = null;

  for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
    const ch = textBeforeCursor[i];
    const prev = i > 0 ? textBeforeCursor[i - 1] : '';

    if (inString) {
      if (ch === inString && prev !== '\\') {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      depth++;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      if (depth > 0) {
        depth--;
      } else if (ch === '(') {
        const beforeParen = textBeforeCursor.slice(0, i);
        const callMatch = beforeParen.match(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*$/);
        if (callMatch) {
          return {
            callable: callMatch[1],
            activeParameter: commaCount
          };
        }
        return null;
      }
    } else if (ch === ',' && depth === 0) {
      commaCount++;
    }
  }
  return null;
}

function mapJediTypeToKind(monaco, jediType) {
  const K = monaco.languages.CompletionItemKind;
  switch (jediType) {
    case 'function':
      return K.Function;
    case 'class':
      return K.Class;
    case 'module':
      return K.Module;
    case 'keyword':
      return K.Keyword;
    case 'instance':
    case 'param':
    case 'statement':
      return K.Variable;
    default:
      return K.Text;
  }
}

export function registerPythonProviders(monaco, ctx) {
  // 1. IntelliSense Completion Provider
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '(', '"', "'"],
    provideCompletionItems: async (model, position) => {
      const code = model.getValue();
      const lineText = model.getLineContent(position.lineNumber);
      const beforeCursor = lineText.slice(0, position.column - 1);
      const wordInfo = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn
      };

      const symbols = extractLocalPythonSymbols(code);
      const suggestions = [];
      const seen = new Set();

      const add = (item) => {
        if (seen.has(item.label)) return;
        seen.add(item.label);
        suggestions.push({ ...item, range });
      };

      // Dot-access completions (`mod.` or `obj.`)
      const dotMatch = beforeCursor.match(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\.\w*$/);
      if (dotMatch) {
        const target = dotMatch[1];
        const resolved = symbols.imports.get(target) || target;
        const modInfo = MODULE_CATALOG[resolved] || MODULE_CATALOG[resolved.split('.')[0]];

        if (modInfo?.members) {
          for (const [mName, mData] of Object.entries(modInfo.members)) {
            add({
              label: mName,
              kind:
                mData.kind === 'Class'
                  ? monaco.languages.CompletionItemKind.Class
                  : mData.kind === 'Function'
                    ? monaco.languages.CompletionItemKind.Function
                    : monaco.languages.CompletionItemKind.Property,
              detail: mData.signature,
              documentation: { value: mData.doc },
              insertText: mName
            });
          }
        }

        // Common Python str/list/dict methods
        for (const [typeName, methods] of Object.entries(TYPE_METHODS)) {
          for (const [mName, mData] of Object.entries(methods)) {
            add({
              label: mName,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: `${typeName} · ${mData.signature}`,
              documentation: { value: mData.doc },
              insertText: mName
            });
          }
        }
      } else {
        // Snippets
        for (const snip of CS50P_SNIPPETS) {
          add({
            label: snip.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: snip.detail,
            insertText: snip.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          });
        }

        // Local functions, classes, variables, imports
        for (const fn of symbols.functions) {
          add({
            label: fn.name,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: `def ${fn.signature}`,
            documentation: { value: fn.doc },
            insertText: fn.name
          });
        }
        for (const cls of symbols.classes) {
          add({
            label: cls.name,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: `class ${cls.name}`,
            insertText: cls.name
          });
        }
        for (const v of symbols.variables) {
          add({
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: 'local variable',
            insertText: v
          });
        }
        for (const [alias, realMod] of symbols.imports.entries()) {
          add({
            label: alias,
            kind: monaco.languages.CompletionItemKind.Module,
            detail: `imported (${realMod})`,
            insertText: alias
          });
        }

        // Builtin functions
        for (const [name, info] of Object.entries(BUILTIN_DOCS)) {
          add({
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: info.signature,
            documentation: { value: info.doc },
            insertText: name
          });
        }

        // Standard + CS50P modules
        for (const [modName, info] of Object.entries(MODULE_CATALOG)) {
          add({
            label: modName,
            kind: monaco.languages.CompletionItemKind.Module,
            detail: `module ${modName}`,
            documentation: { value: info.doc },
            insertText: modName
          });
        }

        // Keywords
        for (const kw of PYTHON_KEYWORDS) {
          add({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: 'keyword',
            insertText: kw
          });
        }
      }

      // Layer 2: Merge live Jedi inference (non-blocking 400ms cap)
      if (ctx.pyClient?.ready && !ctx.pyClient.busy) {
        const jediItems = await ctx.pyClient.jedi(
          'complete',
          code,
          position.lineNumber,
          position.column - 1,
          ctx.getActiveWorkspacePath(),
          ctx.getFilesSnapshot()
        );
        for (const item of jediItems) {
          if (item.name.startsWith('__') && !beforeCursor.endsWith('_')) continue;
          add({
            label: item.name,
            kind: mapJediTypeToKind(monaco, item.type),
            detail: item.description || item.type,
            documentation: item.docstring ? { value: item.docstring } : undefined,
            insertText: item.name
          });
        }
      }

      return { suggestions };
    }
  });

  // 2. Function & Symbol Hover Tooltip Provider
  monaco.languages.registerHoverProvider('python', {
    provideHover: async (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const code = model.getValue();
      const lineText = model.getLineContent(position.lineNumber);
      const beforeWord = lineText.slice(0, word.startColumn - 1);
      const chainMatch = beforeWord.match(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\.$/);
      const chainPrefix = chainMatch ? chainMatch[1] : null;

      const symbols = extractLocalPythonSymbols(code);
      const staticDoc = lookupSymbolDocumentation(word.word, chainPrefix, symbols);

      if (staticDoc) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `\`\`\`python\n${staticDoc.title}\n\`\`\`` },
            { value: staticDoc.body }
          ]
        };
      }

      if (ctx.pyClient?.ready && !ctx.pyClient.busy) {
        const helps = await ctx.pyClient.jedi(
          'hover',
          code,
          position.lineNumber,
          position.column - 1,
          ctx.getActiveWorkspacePath(),
          ctx.getFilesSnapshot()
        );
        if (helps.length > 0) {
          const h = helps[0];
          const header = h.signatures?.[0] || `${h.type} ${h.name}`;
          const contents = [{ value: `\`\`\`python\n${header}\n\`\`\`` }];
          if (h.docstring) {
            contents.push({ value: h.docstring });
          }
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents
          };
        }
      }

      return null;
    }
  });

  // 3. Live Parameter Signature Tooltip Provider
  monaco.languages.registerSignatureHelpProvider('python', {
    signatureHelpTriggerCharacters: ['(', ','],
    signatureHelpRetriggerCharacters: [','],
    provideSignatureHelp: async (model, position) => {
      const code = model.getValue();
      const offset = model.getOffsetAt(position);
      const callCtx = findActiveCallContext(code.slice(0, offset));

      // Try live Jedi signature first if available
      if (ctx.pyClient?.ready && !ctx.pyClient.busy) {
        const jediSigs = await ctx.pyClient.jedi(
          'signature',
          code,
          position.lineNumber,
          position.column - 1,
          ctx.getActiveWorkspacePath(),
          ctx.getFilesSnapshot()
        );
        if (jediSigs.length > 0) {
          return {
            value: {
              activeSignature: 0,
              activeParameter: jediSigs[0].index || 0,
              signatures: jediSigs.map((s) => ({
                label: s.label,
                documentation: s.docstring ? { value: s.docstring } : undefined,
                parameters: (s.params || []).map((p) => ({
                  label: p.description || p.name
                }))
              }))
            },
            dispose: () => {}
          };
        }
      }

      if (!callCtx) return null;

      const parts = callCtx.callable.split('.');
      const fnName = parts.pop();
      const prefix = parts.length > 0 ? parts.join('.') : null;
      const symbols = extractLocalPythonSymbols(code);
      const doc = lookupSymbolDocumentation(fnName, prefix, symbols);
      if (!doc) return null;

      const paramMatch = doc.title.match(/\(([^)]*)\)/);
      const paramList = paramMatch && paramMatch[1].trim()
        ? paramMatch[1].split(',').map((p) => ({ label: p.trim() }))
        : [];

      return {
        value: {
          activeSignature: 0,
          activeParameter: Math.min(callCtx.activeParameter, Math.max(0, paramList.length - 1)),
          signatures: [
            {
              label: doc.title,
              documentation: { value: doc.body },
              parameters: paramList
            }
          ]
        },
        dispose: () => {}
      };
    }
  });
}
