// Récupère le texte des questions en ligne et des pages d'un cours Open edX (courseware.epfl.ch).
// À coller dans la console de Chrome, sur une page du cours, en étant connecté.
// Lecture seule : aucune réponse n'est soumise, rien n'est modifié. Produit contenu-<cours>.json.
(async () => {
  const m = location.href.match(/course-v1:[^/?#]+/);
  if (!m) return console.error("Ouvre d'abord une page du cours (l'adresse doit contenir course-v1:...).");
  const courseId = decodeURIComponent(m[0]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const get = async (url, as = 'json') => {
    for (let i = 0; ; i++) {
      const r = await fetch(url, {credentials: 'include'});
      if (r.ok) return as === 'json' ? r.json() : r.text();
      if (i >= 3 || (r.status !== 429 && r.status < 500)) throw new Error(r.status + ' ' + url);
      await sleep(2000 * 2 ** i);
    }
  };

  const me = await get('/api/user/v1/me');
  const q = new URLSearchParams({
    course_id: courseId, username: me.username, depth: 'all',
    requested_fields: 'children,display_name,type,student_view_url,graded,format',
  });
  const {root, blocks} = await get('/api/courses/v2/blocks/?' + q);

  // Chemin chapitre > séquence > unité pour chaque bloc.
  const path = {};
  (function walk(id, trail) {
    path[id] = trail;
    for (const c of blocks[id].children || []) walk(c, [...trail, blocks[id].display_name]);
  })(root, []);

  // Garde le contenu utile : formules en LaTeX, images en URL absolue, sans boutons ni scripts.
  const clean = el => {
    for (const s of el.querySelectorAll('script[type^="math/tex"]')) {
      const display = /mode\s*=\s*display/.test(s.type);
      s.replaceWith((display ? '\\[' : '\\(') + s.textContent + (display ? '\\]' : '\\)'));
    }
    el.querySelectorAll('script, style, link, meta, noscript, button, .MathJax_Preview, .MathJax, .MathJax_Display, ' +
      '.problem-action-buttons-wrapper, .notification, .bookmark-button-wrapper').forEach(n => n.remove());
    el.querySelectorAll('img[src], a[href]').forEach(n => {
      const at = n.tagName === 'IMG' ? 'src' : 'href';
      try { n.setAttribute(at, new URL(n.getAttribute(at), location.origin).href); } catch (e) {}
    });
    return el;
  };

  const todo = Object.values(blocks).filter(b => b.type === 'problem' || b.type === 'html');
  const out = [];
  let done = 0;
  const worker = async () => {
    while (todo.length) {
      const b = todo.shift();
      const rec = {id: b.id, type: b.type, name: b.display_name, path: path[b.id].slice(1)};
      if (b.graded) rec.graded = true;
      if (b.format) rec.format = b.format;
      try {
        const doc = new DOMParser().parseFromString(await get(b.student_view_url, 'text'), 'text/html');
        let el = doc.querySelector('.xblock-student_view') || doc.body;
        const wrapped = el.querySelector('.problems-wrapper[data-content]');
        if (wrapped) {
          const inner = new DOMParser().parseFromString(wrapped.getAttribute('data-content'), 'text/html');
          el = inner.body;
        }
        clean(el);
        rec.html = el.innerHTML.replace(/\s+/g, ' ').trim();
        rec.text = el.textContent.replace(/\s+/g, ' ').trim();
        rec.images = [...el.querySelectorAll('img[src]')].map(i => i.getAttribute('src'));
      } catch (e) { rec.error = String(e.message || e); }
      out.push(rec);
      if (++done % 25 === 0) console.log(`  ${done} blocs lus…`);
      await sleep(150);
    }
  };
  console.log(`${todo.length} blocs à lire (questions et pages). Compte 3 à 6 minutes.`);
  await Promise.all(Array.from({length: 3}, worker));

  const errors = out.filter(r => r.error).length;
  console.table({cours: courseId, questions: out.filter(r => r.type === 'problem').length,
    pages: out.filter(r => r.type === 'html').length, erreurs: errors});
  const blob = new Blob([JSON.stringify({cours: courseId, genere: new Date().toISOString(), blocs: out})],
    {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contenu-' + courseId.replace(/[^a-z0-9]+/gi, '_') + '.json';
  document.body.append(a); a.click(); a.remove();
  console.log('Fichier téléchargé : ' + a.download + ` (${(blob.size / 1e6).toFixed(1)} Mo)`);
})();
