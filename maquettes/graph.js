// petit traceur pour les maquettes
function plot(el, fns, xr, yr, w, h){
  const sx=x=>(x-xr[0])/(xr[1]-xr[0])*w, sy=y=>h-(y-yr[0])/(yr[1]-yr[0])*h;
  let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block">`;
  for(let x=Math.ceil(xr[0]);x<=xr[1];x++) s+=`<line x1="${sx(x)}" x2="${sx(x)}" y1="0" y2="${h}" stroke="#EEF1F6"/>`;
  for(let y=Math.ceil(yr[0]);y<=yr[1];y++) s+=`<line y1="${sy(y)}" y2="${sy(y)}" x1="0" x2="${w}" stroke="#EEF1F6"/>`;
  s+=`<line x1="0" x2="${w}" y1="${sy(0)}" y2="${sy(0)}" stroke="#8A93A5"/><line y1="0" y2="${h}" x1="${sx(0)}" x2="${sx(0)}" stroke="#8A93A5"/>`;
  for(let x=Math.ceil(xr[0]);x<=xr[1];x++) if(x) s+=`<text x="${sx(x)}" y="${sy(0)+14}" font-size="10" fill="#8A93A5" text-anchor="middle">${x}</text>`;
  for(let y=Math.ceil(yr[0]);y<=yr[1];y++) if(y) s+=`<text x="${sx(0)-6}" y="${sy(y)+3}" font-size="10" fill="#8A93A5" text-anchor="end">${y}</text>`;
  for(const f of fns){ let d='',pen=false; for(let i=0;i<=300;i++){const x=xr[0]+(xr[1]-xr[0])*i/300; const y=f.f(x); if(!isFinite(y)||y<yr[0]-1||y>yr[1]+1){pen=false;continue;} d+=(pen?'L':'M')+sx(x).toFixed(1)+' '+sy(y).toFixed(1);pen=true;}
    s+=`<path d="${d}" fill="none" stroke="${f.c}" stroke-width="${f.w||2.2}" ${f.dash?'stroke-dasharray="5 4"':''}/>`;
    if(f.lab) s+=`<text x="${sx(f.lx)}" y="${sy(f.ly)}" font-size="12" fill="${f.c}" font-weight="700">${f.lab}</text>`;}
  el.innerHTML=s+'</svg>';
}
document.querySelectorAll('[data-tex]').forEach(e=>katex.render(e.dataset.tex,e,{displayMode:e.hasAttribute('data-d'),throwOnError:false}));
