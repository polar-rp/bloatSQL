import type { IRange, languages as monacoLanguages } from 'monaco-editor';

export interface SqlSnippet {
  label: string;
  insertText: string;
  detail: string;
  documentation?: string;
}

export const sqlSnippets: SqlSnippet[] = [
  {
    label: 'SELECT all',
    insertText: 'SELECT * FROM ${1:table_name}\nWHERE ${2:condition};',
    detail: 'SELECT all columns',
    documentation: 'Basic SELECT statement with WHERE clause',
  },
  {
    label: 'SELECT columns',
    insertText: 'SELECT ${1:column1}, ${2:column2}\nFROM ${3:table_name}\nWHERE ${4:condition};',
    detail: 'SELECT specific columns',
    documentation: 'SELECT specific columns with WHERE clause',
  },
  {
    label: 'INSERT',
    insertText: 'INSERT INTO ${1:table_name} (${2:column1}, ${3:column2})\nVALUES (${4:value1}, ${5:value2});',
    detail: 'INSERT statement',
    documentation: 'Insert a new row into a table',
  },
  {
    label: 'UPDATE',
    insertText: 'UPDATE ${1:table_name}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};',
    detail: 'UPDATE statement',
    documentation: 'Update rows in a table',
  },
  {
    label: 'DELETE',
    insertText: 'DELETE FROM ${1:table_name}\nWHERE ${2:condition};',
    detail: 'DELETE statement',
    documentation: 'Delete rows from a table',
  },
  {
    label: 'CREATE TABLE',
    insertText: [
      'CREATE TABLE ${1:table_name} (',
      '  ${2:id} INT PRIMARY KEY AUTO_INCREMENT,',
      '  ${3:name} VARCHAR(255) NOT NULL,',
      '  ${4:created_at} TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      ');',
    ].join('\n'),
    detail: 'CREATE TABLE statement',
    documentation: 'Create a new table',
  },
  {
    label: 'ALTER TABLE ADD',
    insertText: 'ALTER TABLE ${1:table_name}\nADD COLUMN ${2:column_name} ${3:data_type};',
    detail: 'ALTER TABLE - Add column',
    documentation: 'Add a column to an existing table',
  },
  {
    label: 'DROP TABLE',
    insertText: 'DROP TABLE IF EXISTS ${1:table_name};',
    detail: 'DROP TABLE statement',
    documentation: 'Delete a table',
  },
  {
    label: 'INNER JOIN',
    insertText: [
      'SELECT ${1:a}.*',
      'FROM ${2:table1} ${1:a}',
      'INNER JOIN ${3:table2} ${4:b} ON ${1:a}.${5:id} = ${4:b}.${6:foreign_id}',
      'WHERE ${7:condition};',
    ].join('\n'),
    detail: 'INNER JOIN query',
    documentation: 'Join two tables using INNER JOIN',
  },
  {
    label: 'LEFT JOIN',
    insertText: [
      'SELECT ${1:a}.*',
      'FROM ${2:table1} ${1:a}',
      'LEFT JOIN ${3:table2} ${4:b} ON ${1:a}.${5:id} = ${4:b}.${6:foreign_id}',
      'WHERE ${7:condition};',
    ].join('\n'),
    detail: 'LEFT JOIN query',
    documentation: 'Join two tables using LEFT JOIN',
  },
  {
    label: 'GROUP BY',
    insertText: [
      'SELECT ${1:column}, COUNT(*) as count',
      'FROM ${2:table_name}',
      'GROUP BY ${1:column}',
      'HAVING count > ${3:1}',
      'ORDER BY count DESC;',
    ].join('\n'),
    detail: 'GROUP BY query',
    documentation: 'Aggregate rows using GROUP BY',
  },
  {
    label: 'UNION',
    insertText: [
      'SELECT ${1:column}',
      'FROM ${2:table1}',
      'UNION',
      'SELECT ${1:column}',
      'FROM ${3:table2};',
    ].join('\n'),
    detail: 'UNION query',
    documentation: 'Combine results from multiple queries',
  },
  {
    label: 'CASE WHEN',
    insertText: [
      'CASE',
      '  WHEN ${1:condition1} THEN ${2:result1}',
      '  WHEN ${3:condition2} THEN ${4:result2}',
      '  ELSE ${5:default_result}',
      'END',
    ].join('\n'),
    detail: 'CASE expression',
    documentation: 'Conditional expression',
  },
  {
    label: 'COUNT',
    insertText: 'SELECT COUNT(*) as total FROM ${1:table_name} WHERE ${2:condition};',
    detail: 'COUNT rows',
    documentation: 'Count rows matching a condition',
  },
  {
    label: 'EXISTS',
    insertText: [
      'SELECT *',
      'FROM ${1:table1} ${2:a}',
      'WHERE EXISTS (',
      '  SELECT 1',
      '  FROM ${3:table2} ${4:b}',
      '  WHERE ${4:b}.${5:id} = ${2:a}.${6:foreign_id}',
      ');',
    ].join('\n'),
    detail: 'EXISTS subquery',
    documentation: 'Check if subquery returns any rows',
  },
];

export function convertSnippetToCompletion(
  snippet: SqlSnippet,
  range: IRange,
  monaco: any
): monacoLanguages.CompletionItem {
  return {
    label: snippet.label,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: snippet.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
    detail: snippet.detail,
    documentation: snippet.documentation,
  };
}
