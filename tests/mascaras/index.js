// Punto de entrada para `node --test tests/mascaras/` (Node 22 resuelve la carpeta a este archivo).
const fs = require('node:fs');
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith('.test.cjs')).sort()) require('./' + f);
