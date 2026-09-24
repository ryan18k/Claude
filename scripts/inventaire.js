// Inventaire d'un cours Open edX (courseware.epfl.ch).
// À coller dans la console de Chrome, sur une page du cours, en étant connecté.
// Lit uniquement ; ne modifie rien. Produit inventaire-<cours>.json.
(async () => {
  const m = location.href.match(/course-v1:[^/?#]+/);
  if (!m) return console.error("Ouvre d'abord une page du cours (l'adresse doit contenir course-v1:...).");
  const courseId = decodeURIComponent(m[0]);
  const get = async (url, as = 'json') => {
    const r = await fetch(url, {credentials: 'include'});
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return as === 'json' ? r.json() : r.text();
  };

  const me = await get('/api/user/v1/me');
  const q = new URLSearchParams({
    course_id: courseId, username: me.username, depth: 'all',
    requested_fields: 'children,display_name,type,student_view_url,lms_web_url,graded,format',
    student_view_data: 'video',
  });
  const {root, blocks} = await get('/api/courses/v2/blocks/?' + q);
  console.log(`Cours ${courseId} : ${Object.keys(blocks).length} blocs. Analyse des pages…`);

  // Contenu des blocs HTML et exercices : liens vers PDF/fichiers, texte, nombre de questions.
  const leafTypes = new Set(['html', 'problem']);
  const leaves = Object.values(blocks).filter(b => leafTypes.has(b.type));
  let done = 0;
  const worker = async () => {
    while (leaves.length) {
      const b = leaves.shift();
      try {
        const html = await get(b.student_view_url, 'text');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        b.files = [...new Set([...doc.querySelectorAll('a[href], iframe[src], embed[src], object[data]')]
          .map(a => a.getAttribute('href') || a.getAttribute('src') || a.getAttribute('data'))
          .filter(h => /asset-v1|\.pdf|\/static\/|\.zip|\.java|\.txt/i.test(h))
          .map(h => new URL(h, location.origin).href))];
        b.questions = doc.querySelectorAll('.problem .wrapper-problem-response, .problem input, .problem textarea').length;
        b.textChars = (doc.body.innerText || '').trim().length;
      } catch (e) { b.error = String(e.message || e); }
      if (++done % 20 === 0) console.log(`  ${done} pages lues…`);
    }
  };
  await Promise.all(Array.from({length: 4}, worker));

  // Arbre lisible : chapitre > séquence > unité > composants.
  const node = id => {
    const b = blocks[id];
    const n = {type: b.type, name: b.display_name, id: b.id, url: b.lms_web_url};
    if (b.graded) n.graded = true;
    if (b.format) n.format = b.format;
    if (b.files?.length) n.files = b.files;
    if (b.questions) n.questions = b.questions;
    if (b.textChars) n.textChars = b.textChars;
    if (b.error) n.error = b.error;
    if (b.type === 'video' && b.student_view_data) {
      const v = b.student_view_data;
      n.duration = v.duration;
      n.transcripts = v.transcripts || {};
      n.videoUrls = Object.values(v.encoded_videos || {}).map(e => e.url).filter(Boolean);
    }
    if (b.children?.length) n.children = b.children.map(node);
    return n;
  };
  const tree = node(root);

  const count = t => Object.values(blocks).filter(b => b.type === t).length;
  const allFiles = new Set(Object.values(blocks).flatMap(b => b.files || []));
  const summary = {
    cours: courseId, genere: new Date().toISOString(),
    chapitres: count('chapter'), sequences: count('sequential'), unites: count('vertical'),
    pagesTexte: count('html'), exercices: count('problem'), videos: count('video'),
    fichiers: allFiles.size, erreurs: Object.values(blocks).filter(b => b.error).length,
  };
  console.table(summary);

  const out = JSON.stringify({summary, tree}, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out], {type: 'application/json'}));
  a.download = 'inventaire-' + courseId.replace(/[^a-z0-9]+/gi, '_') + '.json';
  document.body.append(a); a.click(); a.remove();
  console.log('Fichier téléchargé : ' + a.download);
})();
