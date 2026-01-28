/**
 * Example usage of Console Log Store
 *
 * Import the addLog function from the store:
 * import { useAddLog } from '../stores/consoleLogStore';
 *
 * In your component:
 * const addLog = useAddLog();
 *
 * Then call it when you want to log an action:
 * addLog('USE `ecommerce_db`;');
 * addLog('SELECT * FROM users WHERE id = 1;');
 * addLog('INSERT INTO products (name, price) VALUES ("Product", 99.99);');
 *
 * The timestamp will be automatically added in the format:
 * -- 2026-01-28 14:09:30.2450
 * {your action}
 */

// Example in a query execution component:
/*
import { useAddLog } from '../stores/consoleLogStore';

function QueryExecutor() {
  const addLog = useAddLog();

  const executeQuery = async (query: string) => {
    addLog(query);

    // ... execute the query
    const result = await api.executeQuery(query);
    return result;
  };

  return (
    // ... component JSX
  );
}
*/
