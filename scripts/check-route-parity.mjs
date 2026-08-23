import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8');
const frontend = fs.readFileSync('src/lib/appCapabilityRegistry.js', 'utf8');
const backend = fs.readFileSync('base44/shared/appCapabilities.ts', 'utf8');
const routeRe = /<Route\s+path="([^"]+)"/g;
const patternRe = /pattern:\s*'([^']+)'/g;
const extract = (text, re) => [...text.matchAll(re)].map(m => m[1]);
const normalize = arr => [...new Set(arr)].sort();
const excluded = new Set(['/login','/register','/forgot-password','/reset-password','/onboarding']);
const appRoutes = normalize(extract(app, routeRe).filter(r => r !== '*' && !excluded.has(r)));
const frontRoutes = normalize(extract(frontend, patternRe));
const backRoutes = normalize(extract(backend, patternRe));
const diff = (a,b) => a.filter(x => !b.includes(x));
const problems = { missingFrontend: diff(appRoutes,frontRoutes), extraFrontend: diff(frontRoutes,appRoutes), missingBackend: diff(appRoutes,backRoutes), extraBackend: diff(backRoutes,appRoutes) };
if (Object.values(problems).some(v => v.length)) { console.error('Route registry parity check failed:', JSON.stringify(problems,null,2)); process.exit(1); }
console.log(`Route parity OK: ${appRoutes.length} application routes.`);
