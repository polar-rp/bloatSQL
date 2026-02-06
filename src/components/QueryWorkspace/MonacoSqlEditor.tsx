import { useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { useMantineColorScheme } from '@mantine/core';
import { editor as monacoEditor, languages } from 'monaco-editor';
import { useTables } from '../../stores/queryStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { DatabaseType } from '../../types/database';
import { sqlSnippets, convertSnippetToCompletion } from './sql-snippets';

interface MonacoSqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  height?: string | number;
}

export function MonacoSqlEditor({
  value,
  onChange,
  onExecute,
  height = '100%',
}: MonacoSqlEditorProps) {
  const { colorScheme } = useMantineColorScheme();
  const tables = useTables();
  const { activeConnection } = useConnectionStore();
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const setupSqlAutocomplete = (monaco: Monaco) => {
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: languages.CompletionItem[] = [];

        const sqlKeywords = [
          'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
          'CREATE', 'DROP', 'ALTER', 'TABLE', 'DATABASE', 'INDEX',
          'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
          'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
          'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
          'NULL', 'IS', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
          'UNION', 'ALL', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
        ];

        sqlKeywords.forEach((keyword) => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range,
            detail: 'SQL Keyword',
          });
        });

        if (tables && tables.length > 0) {
          tables.forEach((table) => {
            const isPostgres = activeConnection?.dbType === DatabaseType.PostgreSQL;
            const quoteChar = isPostgres ? '"' : '`';

            suggestions.push({
              label: table,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `${quoteChar}${table}${quoteChar}`,
              range,
              detail: 'Table',
              documentation: `Table: ${table}`,
            });

            suggestions.push({
              label: table,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: table,
              range,
              detail: 'Table (unquoted)',
            });
          });
        }

        const sqlFunctions = [
          { name: 'NOW()', detail: 'Current timestamp' },
          { name: 'COUNT(*)', detail: 'Count all rows' },
          { name: 'CONCAT()', detail: 'Concatenate strings' },
          { name: 'COALESCE()', detail: 'Return first non-NULL value' },
          { name: 'SUBSTRING()', detail: 'Extract substring' },
          { name: 'UPPER()', detail: 'Convert to uppercase' },
          { name: 'LOWER()', detail: 'Convert to lowercase' },
          { name: 'TRIM()', detail: 'Remove whitespace' },
          { name: 'LENGTH()', detail: 'String length' },
          { name: 'ROUND()', detail: 'Round number' },
          { name: 'DATE_FORMAT()', detail: 'Format date' },
          { name: 'IFNULL()', detail: 'Replace NULL values' },
          { name: 'CAST()', detail: 'Convert data type' },
        ];

        sqlFunctions.forEach(({ name, detail }) => {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: name,
            range,
            detail,
          });
        });

        sqlSnippets.forEach((snippet) => {
          suggestions.push(convertSnippetToCompletion(snippet, range, monaco));
        });

        return { suggestions };
      },
    });

    monaco.languages.registerDocumentFormattingEditProvider('sql', {
      provideDocumentFormattingEdits: (model) => {
        const text = model.getValue();
        const formatted = formatSql(text);

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ];
      },
    });
  };

  const formatSql = (sql: string): string => {
    let formatted = sql
      .replace(/\s+/g, ' ')
      .trim();

    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
      'INSERT INTO', 'UPDATE', 'DELETE FROM', 'CREATE', 'DROP', 'ALTER',
      'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
    ];

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');

    formatted = formatted
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    if (!formatted.endsWith(';')) {
      formatted += ';';
    }

    return formatted;
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    setupSqlAutocomplete(monaco);

    monaco.languages.setLanguageConfiguration('sql', {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['(', ')'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: "'", close: "'" },
        { open: '"', close: '"' },
        { open: '`', close: '`' },
      ],
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute();
    });

    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        editor.getAction('editor.action.formatDocument')?.run();
      }
    );

    editor.focus();
  };

  useEffect(() => {
    if (monacoRef.current && tables) {
      setupSqlAutocomplete(monacoRef.current);
    }
  }, [tables]);

  return (
    <Editor
      height={height}
      defaultLanguage="sql"
      value={value}
      onChange={(newValue) => onChange(newValue || '')}
      onMount={handleEditorDidMount}
      theme={colorScheme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        minimap: { enabled: false },
        fontSize: 16,
        fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        wrappingIndent: 'indent',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        parameterHints: {
          enabled: true,
        },
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        contextmenu: true,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
      loading={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          Loading editor...
        </div>
      }
    />
  );
}
