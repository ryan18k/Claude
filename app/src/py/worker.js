// Worker SymPy (worker de type module, exigé par Pyodide) : charge Pyodide et SymPy depuis les fichiers
// de l'artefact (aucun réseau externe), puis exécute tuteur/sympy_checks.py.
// Messages : {id, op, args} → {id, ok, result | error}.
let BASE = self.location.href.replace(/[^/]*$/, '');
let py = null;
let ready = null;
let stage = 'démarrage';
const logs = [];                                                     // sortie de Python, pour le diagnostic

async function b64(name) {
  const r = await fetch(BASE + name + '.b64.txt');
  if (!r.ok) throw new Error(name + ' : HTTP ' + r.status);
  const s = atob(await r.text());
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

async function init() {
  const t0 = Date.now();
  stage = 'import de pyodide.mjs';
  const {loadPyodide} = await import(BASE + 'pyodide.mjs');
  stage = 'bibliothèque standard';
  const std = URL.createObjectURL(new Blob([await b64('python_stdlib')], {type: 'application/zip'}));
  stage = 'démarrage de Python';
  py = await loadPyodide({indexURL: BASE, stdLibURL: std, stdout: t => logs.push(t), stderr: t => logs.push(t)});
  stage = 'installation de SymPy';
  for (const w of ['mpmath', 'sympy']) py.unpackArchive(await b64(w), 'wheel');
  stage = 'module de vérification';
  const src = await (await fetch(BASE + 'sympy_checks.py.txt')).text();
  py.FS.mkdirTree('/home/pyodide/tuteur');
  py.FS.writeFile('/home/pyodide/tuteur/sympy_checks.py', src);
  py.runPython('import sys, json\nsys.path.insert(0, "/home/pyodide/tuteur")\nimport sympy_checks as C\nimport sympy\nC.check_text({"type": "eq", "expr": "x**2"}, "x²")');
  stage = 'prêt';
  return {ms: Date.now() - t0, version: py.runPython('sympy.__version__'), python: py.runPython('import sys; sys.version.split()[0]')};
}

const OPS = {
  check_text: 'C.check_text(A["spec"], A["text"])',
  run: 'C.run(A["spec"], A.get("answer"))',
  compute: 'C.compute(A["spec"])',
  latex: 'C.tex(C.P(C.normalize_expr(A["text"])))',
  plot: 'C.plot_points(A["expr"], float(A["xmin"]), float(A["xmax"]), int(A.get("n", 400)))',
};

self.onmessage = async (e) => {
  const {id, op, args, base} = e.data || {};
  if (base) BASE = base;
  try {
    if (!ready) ready = init();
    const info = await ready;
    if (op === 'init') return self.postMessage({id, ok: true, result: info});
    if (!OPS[op]) throw new Error('opération inconnue : ' + op);
    py.globals.set('ARGS_JSON', JSON.stringify(args || {}));
    const out = py.runPython('A = json.loads(ARGS_JSON)\njson.dumps(' + OPS[op] + ', default=str)');
    self.postMessage({id, ok: true, result: JSON.parse(out)});
  } catch (err) {
    const msg = String((err && err.message) || err).slice(-500);
    self.postMessage({id, ok: false, error: op === 'init' || stage !== 'prêt' ? `[étape : ${stage}] ${msg}` + (logs.length ? ' | sortie : ' + logs.slice(-6).join(' / ').slice(-500) : '') : msg});
  }
};
