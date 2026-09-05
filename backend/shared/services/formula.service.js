const { Parser } = require('hot-formula-parser');

// Parses a cell ref like "B3" into { col: 1 (0-indexed), row: 3 }
const parseRef = (ref) => {
  const match = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!match) return null;
  const [, colLetters, rowStr] = match;
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) col = col * 26 + (colLetters.charCodeAt(i) - 64);
  return { col: col - 1, row: parseInt(rowStr, 10) };
};

const colLetter = (colIndex) => {
  let n = colIndex + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

// Evaluates every formula cell ("=SUM(A1:A3)") in a tab's `cells` Map and
// returns a plain object of { ref: { value, formula, computedValue, error } }
// without mutating the stored raw values - computedValue is what the UI shows.
const evaluateTab = (cellsMap) => {
  const raw = {};
  cellsMap.forEach((v, k) => { raw[k] = v; });

  const parser = new Parser();

  parser.on('callCellValue', (cellCoord, done) => {
    const ref = `${colLetter(cellCoord.column.index)}${cellCoord.row.index + 1}`;
    const cell = raw[ref];
    if (!cell) return done(0);
    const val = cell.value;
    done(isNaN(val) || val === '' ? val : Number(val));
  });

  parser.on('callRangeValue', (startCoord, endCoord, done) => {
    const values = [];
    for (let r = startCoord.row.index; r <= endCoord.row.index; r++) {
      const rowValues = [];
      for (let c = startCoord.column.index; c <= endCoord.column.index; c++) {
        const ref = `${colLetter(c)}${r + 1}`;
        const cell = raw[ref];
        const val = cell?.value;
        rowValues.push(val === undefined || val === '' ? 0 : (isNaN(val) ? val : Number(val)));
      }
      values.push(rowValues);
    }
    done(values);
  });

  const result = {};
  Object.entries(raw).forEach(([ref, cell]) => {
    if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
      const { result: value, error } = parser.parse(cell.value.slice(1));
      result[ref] = { ...cell, computedValue: error ? `#${error}` : value };
    } else {
      result[ref] = { ...cell, computedValue: cell.value };
    }
  });

  return result;
};

module.exports = { evaluateTab };
