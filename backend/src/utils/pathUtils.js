function normalizePath(p) {
  if (!p || p === '/') return p || '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

module.exports = { normalizePath };
