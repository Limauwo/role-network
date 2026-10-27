import rawGraphData from './graph.json';
import { validateGraphData } from './validator';
import type { GraphData } from '../types/graph';

/**
 * Loads and returns strongly-typed GraphData.
 * In development mode (import.meta.env?.DEV), it validates the data structure
 * and logs/throws warnings or errors if inconsistencies are found.
 */
export function loadGraphData(): GraphData {
  const data = rawGraphData as unknown as GraphData;

  const isDev =
    typeof import.meta !== 'undefined' &&
    Boolean(import.meta.env && import.meta.env.DEV);

  if (isDev) {
    const errors = validateGraphData(data);
    if (errors.length > 0) {
      const formattedErrors = errors
        .map((e) => `[${e.type}] ${e.message}`)
        .join('\n');
      console.error(
        `[loadGraphData] Graph data validation failed with ${errors.length} error(s):\n${formattedErrors}`
      );
      throw new Error(
        `Graph data runtime validation failed with ${errors.length} error(s):\n${formattedErrors}`
      );
    }
  }

  return data;
}
