# Monaco Editor Features

BloatSQL now includes **Monaco Editor** (the same editor powering VS Code) with advanced SQL editing features.

## ✨ Features

### 🎨 Syntax Highlighting
- Full SQL syntax highlighting
- Color-coded keywords, strings, comments, and numbers
- Auto-adjusts to light/dark theme

### 🔍 Intelligent Autocomplete
Press `Ctrl+Space` or start typing to see suggestions for:

#### SQL Keywords
- `SELECT`, `FROM`, `WHERE`, `JOIN`, etc.
- All major SQL commands and clauses

#### Table Names
- Auto-suggests all tables from the current database
- Shows quoted and unquoted versions
- Automatically uses correct quote character (`` ` `` for MySQL, `"` for PostgreSQL)

#### SQL Functions
- `NOW()`, `COUNT()`, `CONCAT()`, `COALESCE()`
- `SUBSTRING()`, `UPPER()`, `LOWER()`, `TRIM()`
- `DATE_FORMAT()`, `IFNULL()`, `CAST()`, and more

#### Code Snippets
Pre-built SQL snippets with placeholders:
- `SELECT all` - Basic SELECT query
- `SELECT columns` - SELECT with specific columns
- `INSERT` - INSERT statement
- `UPDATE` - UPDATE statement
- `DELETE` - DELETE statement
- `CREATE TABLE` - Table creation
- `INNER JOIN` / `LEFT JOIN` - JOIN queries
- `GROUP BY` - Aggregation query
- `CASE WHEN` - Conditional expression
- And more!

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Execute query |
| `Shift+Alt+F` | Format SQL |
| `Ctrl+Space` | Trigger autocomplete |
| `Ctrl+/` | Toggle line comment |
| `Ctrl+F` | Find |
| `Ctrl+H` | Find and replace |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Alt+↑/↓` | Move line up/down |
| `Ctrl+D` | Add selection to next match |
| `Ctrl+Shift+L` | Select all occurrences |

### 🎯 Smart Code Features

#### Auto-closing
- Brackets: `()`, `[]`
- Quotes: `'`, `"`, `` ` ``

#### Auto-indent
- Maintains proper indentation
- Smart indent on new lines

#### Bracket Matching
- Highlights matching brackets
- Jump to matching bracket with `Ctrl+Shift+\`

#### Multi-cursor Editing
- `Alt+Click` to add cursors
- `Ctrl+Alt+↑/↓` to add cursor above/below

### 📐 SQL Formatting

Format your SQL code with `Shift+Alt+F`:

**Before:**
```sql
select * from users where id=1 and status='active' order by created_at desc;
```

**After:**
```sql
SELECT *
FROM users
WHERE id=1
  AND status='active'
ORDER BY created_at DESC;
```

### 💡 IntelliSense Features

- **Parameter hints**: Shows function signatures
- **Quick info**: Hover over keywords for documentation
- **Error detection**: Highlights basic syntax errors
- **Word wrap**: Long queries wrap automatically

### 🎨 Editor Customization

The editor automatically adapts to:
- **Theme**: Switches between light and dark themes
- **Font**: Uses monospace font (JetBrains Mono, Consolas, Monaco)
- **Font size**: 13px for optimal readability
- **Line numbers**: Always visible
- **Minimap**: Disabled for cleaner interface

### 📝 Code Snippets Usage

1. Start typing a snippet name (e.g., `select`)
2. Select the snippet from autocomplete
3. Press `Enter` or `Tab`
4. Use `Tab` to jump between placeholders
5. Fill in your values

Example with `SELECT all` snippet:
```sql
SELECT * FROM table_name  -- Press Tab to edit table_name
WHERE condition;          -- Press Tab to edit condition
```

### 🔧 Advanced Features

#### Find & Replace
- `Ctrl+F`: Find in current query
- `Ctrl+H`: Find and replace
- Regex support: Click the `.*` button in find dialog
- Case-sensitive: Click `Aa` button

#### Multi-line Editing
- `Alt+Shift+↓`: Insert cursor below
- `Alt+Shift+↑`: Insert cursor above
- `Ctrl+Shift+L`: Select all occurrences of current word

#### Code Folding
- Hover over line numbers to see fold icons
- Click to fold/unfold code blocks

## 🚀 Tips & Tricks

### Quick SELECT
1. Type `sel` + `Ctrl+Space`
2. Choose "SELECT all" snippet
3. Tab through placeholders

### Format Messy SQL
1. Paste unformatted SQL
2. Press `Shift+Alt+F`
3. Instantly formatted!

### Multi-cursor Magic
1. Select a word (e.g., `user_id`)
2. Press `Ctrl+D` repeatedly to select next occurrences
3. Edit all at once

### Comment Multiple Lines
1. Select lines
2. Press `Ctrl+/`
3. Toggle comments on/off

### Search in Query
- `Ctrl+F`: Quick search
- `Enter`: Next match
- `Shift+Enter`: Previous match
- `Esc`: Close search

## 🎓 Monaco Editor Advantages

Compared to the previous textarea:
- ✅ **Professional IDE experience**
- ✅ **Intelligent code completion**
- ✅ **Real-time syntax validation**
- ✅ **Powerful find & replace**
- ✅ **Multi-cursor editing**
- ✅ **Automatic formatting**
- ✅ **Theme integration**
- ✅ **Customizable shortcuts**

## 🐛 Known Limitations

- Column-level autocomplete requires manual fetching (coming soon)
- Advanced SQL validation limited to syntax only
- Formatter is basic (improved version planned)

## 📚 Learn More

Monaco Editor powers VS Code and provides:
- Same editing experience as Visual Studio Code
- Battle-tested in millions of projects
- Extensive language support
- Active development and updates

---

**Enjoy your enhanced SQL editing experience!** 🎉
