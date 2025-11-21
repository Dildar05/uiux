/* WCAG contrast utilities */
function hexToRgb(hex){hex=hex.replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const bigint=parseInt(hex,16); return [(bigint>>16)&255,(bigint>>8)&255, bigint&255];}
function srgbToLinear(v){v=v/255; return v<=0.03928? v/12.92: Math.pow((v+0.055)/1.055,2.4);} 
function relativeLuminance(hex){const [r,g,b]=hexToRgb(hex); return 0.2126*srgbToLinear(r)+0.7152*srgbToLinear(g)+0.0722*srgbToLinear(b);} 
function contrastRatio(hex1,hex2){const L1=relativeLuminance(hex1), L2=relativeLuminance(hex2); const light=Math.max(L1,L2), dark=Math.min(L1,L2); return (light+0.05)/(dark+0.05);} 
function formatRatio(r){return Math.round(r*100)/100}

/* Default pairs — взято из desktop/css/desktop-styles.css */
function buildDefaultPairs(){
  return [
    {name:'Primary text on background (Основной текст на фоне)', fg:'#15803d', bg:'#f9fafb', type:'normal', suggested:'#0f5130'},
    {name:'Primary button (white on primary) (Основная кнопка — белый текст на основном фоне)', fg:'#ffffff', bg:'#15803d', type:'normal', suggested:'#0f5130'},
    {name:'Secondary accent on background (Вторичный акцент на фоне)', fg:'#84cc16', bg:'#f9fafb', type:'normal', suggested:'#5f8d0f'},
    {name:'Text (primary) on card (Текст (основной) на карточке)', fg:'#374151', bg:'#ffffff', type:'normal', suggested:'#111827'},
    {name:'Muted text on background (Приглушённый текст на фоне)', fg:'#6b7280', bg:'#f9fafb', type:'normal', suggested:'#4b5563'},
    {name:'Sidebar bg and white text (Фон сайдбара и белый текст)', fg:'#ffffff', bg:'#334155', type:'large', suggested:'#ffffff'}
  ];
}

function addDefaultRows(){
  const container=document.getElementById('color-rows'); container.innerHTML='';
  buildDefaultPairs().forEach((p, idx)=>{
    const div=document.createElement('div'); div.className='row card color-row';
    div.dataset.suggested = p.suggested || '';
    div.dataset.index = String(idx);
    div.innerHTML = `<input class='cname' placeholder='${p.name}' style='flex:1;padding:8px;border-radius:6px;border:1px solid #ddd'>
      <input class='input-hex fg' value='${p.fg}'>
      <input class='input-hex bg' value='${p.bg}'>
      <select class='sizeType'>
        <option value='normal'>Normal (16px)</option>
        <option value='large'>Large/Bold (≥24px bold)</option>
      </select>
      <button class='btn small apply-suggest'>Применить рекомендацию</button>`;
    container.appendChild(div);
    div.querySelector('.apply-suggest').addEventListener('click',()=>{
      const fgIn=div.querySelector('.fg'); const bgIn=div.querySelector('.bg');
      // If suggested is present, apply it to foreground
      const suggested = div.dataset.suggested;
      if(suggested){
        fgIn.value = suggested;
      }
    });
  });
}

function computeAndRender(){
  const tbody=document.getElementById('contrast-body'); tbody.innerHTML='';
  const rows=document.querySelectorAll('.color-row');
  const csvLines=['Name,Foreground,Background,Contrast (фактический),Требование WCAG 2.1 (AA),Recommendation,Result'];
  rows.forEach((row, idx)=>{
    const name=row.querySelector('.cname').value||row.querySelector('.cname').placeholder;
    const fg=row.querySelector('.fg').value;
    const bg=row.querySelector('.bg').value;
    const sizeType=row.querySelector('.sizeType').value;
    let ratio=0; try{ ratio=contrastRatio(fg,bg); }catch(e){ ratio=0 }
    const requirement = sizeType==='large' ? 3 : 4.5;
    const pass = ratio>=requirement;
    // recommendation: use dataset.suggested if present, otherwise pick black/white depending on luminance
    let recommendation = '';
    const suggested = row.dataset.suggested || '';
    if(!pass){
      if(suggested){ recommendation = suggested; }
      else {
        // choose a contrasting color: if background is light suggest #000000, else #ffffff
        recommendation = relativeLuminance(bg) > relativeLuminance(fg) ? '#000000' : '#ffffff';
      }
    }
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${name}</td>
      <td><span class='color-swatch' style='background:${fg}'></span> ${fg}</td>
      <td><span class='color-swatch' style='background:${bg}'></span> ${bg}</td>
      <td>${formatRatio(ratio)}</td>
      <td>≥ ${requirement}</td>
      <td>${recommendation? `<span class='color-swatch' style='background:${recommendation}'></span> ${recommendation}` : ''}</td>
      <td>${recommendation? `<button class='btn small apply-from-table' data-idx='${idx}'>Применить</button>` : ''}</td>
      <td>${pass?'<strong style="color:green">OK</strong>':'<strong style="color:#d93025">FAIL</strong>'}</td>`;
    tbody.appendChild(tr);
    csvLines.push(`${name},${fg},${bg},${formatRatio(ratio)},>=${requirement},${recommendation || ''},${pass?'OK':'FAIL'}`);
  });
  // attach handlers for apply buttons
  document.querySelectorAll('.apply-from-table').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.idx);
      const row = document.querySelectorAll('.color-row')[idx];
      if(!row) return;
      const rec = row.dataset.suggested || '';
      if(rec){ row.querySelector('.fg').value = rec; }
    });
  });
  const blob=new Blob([csvLines.join('\n')],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.getElementById('csv-link'); a.href=url; a.download='contrast-table.csv'; a.classList.remove('hidden');

  // Build analysis summary for failed pairs
  const analysisEl = document.getElementById('analysis-content');
  const failed = [];
  const allRows = document.querySelectorAll('.color-row');
  allRows.forEach((row, idx)=>{
    const name = row.querySelector('.cname').value || row.querySelector('.cname').placeholder;
    const fg = row.querySelector('.fg').value;
    const bg = row.querySelector('.bg').value;
    const sizeType = row.querySelector('.sizeType').value;
    let ratio = 0; try{ ratio = contrastRatio(fg,bg); }catch(e){ ratio = 0 }
    const requirement = sizeType==='large' ? 3 : 4.5;
    const pass = ratio>=requirement;
    if(!pass){
      let suggestion = row.dataset.suggested || '';
      if(!suggestion){ suggestion = suggestReplacement(fg,bg,requirement); }
      failed.push({idx,name,fg,bg,ratio,requirement,suggestion});
    }
  });

  if(failed.length===0){
    analysisEl.innerHTML = '<strong>Все цветовые пары проходят требования WCAG 2.1 (AA).</strong>';
  } else {
    let html = '<div class="small">Ниже приведены пары, не прошедшие проверку, и рекомендуемые исправления.</div><ul>';
    failed.forEach(f=>{
      html += `<li><strong>${f.name}</strong>: foreground ${f.fg} на background ${f.bg} — текущий контраст ${formatRatio(f.ratio)}, требование ≥ ${f.requirement}. Рекомендация: ${f.suggestion? `<span class='color-swatch' style='background:${f.suggestion}'></span> ${f.suggestion}` : '—'}</li>`;
    });
    html += '</ul>';
    try{
      const oldA = contrastRatio('#999999','#ffffff');
      const newA = contrastRatio('#666666','#ffffff');
      html += `<div class="small">Пример: замена <code>#999999</code> → <code>#666666</code> повышает контраст на белом фоне: ${formatRatio(oldA)} → ${formatRatio(newA)} (рекомендуется заменять слабые серые оттенки на более тёмные для улучшения читаемости).</div>`;
    }catch(e){}
    analysisEl.innerHTML = html;
  }
}

function setup(){
  addDefaultRows();
  document.getElementById('compute-btn').addEventListener('click',computeAndRender);
  document.getElementById('scan-typography').addEventListener('click', scanTypography);
  // detailed checks wiring
  const runBtn = document.getElementById('run-detailed');
  if(runBtn) runBtn.addEventListener('click', checkDetailed);
  const genBtn = document.getElementById('gen-a11y');
  if(genBtn) genBtn.addEventListener('click', ()=>{ generateA11yPalette(); alert('A11y palette generated — нажмите Apply A11y to "After" preview чтобы увидеть результат.'); });
  const applyBtn = document.getElementById('apply-a11y-preview');
  if(applyBtn) applyBtn.addEventListener('click', ()=>{ applyA11yToPreview(); });
  const resetBtn = document.getElementById('reset-preview');
  if(resetBtn) resetBtn.addEventListener('click', ()=>{ resetPreviews(); });
  const copyBtn = document.getElementById('copy-typography-css');
  if(copyBtn){
    copyBtn.addEventListener('click', ()=>{
      const pre = document.getElementById('typography-css');
      const text = pre ? pre.textContent : '';
      navigator.clipboard.writeText(text).then(()=>{
        const msg = document.getElementById('copy-msg'); if(msg){ msg.style.display='block'; setTimeout(()=>msg.style.display='none',2000); }
      }).catch(()=>{
        alert('Не удалось скопировать — разрешите доступ к буферу обмена или скопируйте вручную.');
      });
    });
  }
  document.getElementById('theme-toggle').addEventListener('change',e=>{ if(e.target.checked) document.documentElement.classList.add('a11y'); else document.documentElement.classList.remove('a11y'); });
  document.getElementById('sim-protan').addEventListener('change',e=> toggleFilterClass('filter-protan', e.target.checked));
  document.getElementById('sim-deutan').addEventListener('change',e=> toggleFilterClass('filter-deutan', e.target.checked));
  document.getElementById('sim-tritan').addEventListener('change',e=> toggleFilterClass('filter-tritan', e.target.checked));
  const checkMobileBtn = document.getElementById('check-mobile-targets');
  if(checkMobileBtn) checkMobileBtn.addEventListener('click', checkMobileTargets);
  // main preview theme toggle
  const mainToggle = document.getElementById('main-theme-toggle');
  if(mainToggle){
    mainToggle.addEventListener('change', (e)=>{
      const iframe = document.getElementById('main-preview-iframe');
      if(!iframe) return;
      try{
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const enabled = e.target.checked;
        // Toggle the .dark class (used by desktop styles to switch variables)
        if(enabled) doc.documentElement.classList.add('dark'); else doc.documentElement.classList.remove('dark');

        // Insert an override <style> to map some Tailwind utility classes to the CSS variables
        const styleId = 'audit-theme-overrides';
        let styleEl = doc.getElementById(styleId);
        if(enabled){
          if(!styleEl){
            styleEl = doc.createElement('style'); styleEl.id = styleId;
            styleEl.textContent = `
              /* Audit overrides: broader mapping of Tailwind utilities and layout selectors to design tokens */
              html, body { background: var(--background) !important; color: var(--text) !important; }
              /* common light bg utilities -> page background */
              .bg-white, .bg-gray-50, .bg-slate-50, .bg-slate-100, .bg-slate-200, .bg-slate-300 { background-color: var(--background) !important; }
              /* sidebar / dark surfaces */
              .bg-slate-600, .bg-slate-700, .bg-slate-800, .bg-slate-900, .desktop-sidebar { background-color: var(--sidebar-bg) !important; color: var(--text) !important; }
              /* cards and panels */
              .card, .stats-card, .desktop-header, .desktop-content-wrapper, .desktop-main, .mock-screen, .mobile-card { background-color: var(--card) !important; color: var(--text) !important; }
              /* primary / green */
              .bg-green-500, .bg-green-400, .from-green-400, .to-green-600 { background-color: var(--primary) !important; }
              /* text colors (gray / slate families) */
              .text-slate-300, .text-slate-400, .text-gray-400, .text-gray-500, .text-gray-600 { color: var(--text-light) !important; }
              .text-slate-700, .text-slate-800, .text-slate-900, .text-gray-700, .text-gray-800, .text-gray-900, .text-black { color: var(--text) !important; }
              /* borders */
              .border-slate-600, .border-slate-700, .border, .border-t, .border-b { border-color: var(--border) !important; }
              /* buttons */
              .btn, .mobile-primary, .mock-primary { background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important; color: var(--card) !important; border-color: transparent !important; }
              .btn.secondary, .mock-secondary { background: var(--card) !important; color: var(--primary) !important; border-color: var(--primary) !important; }
              /* ensure inputs/search feel right */
              input, textarea, select { background: var(--card) !important; color: var(--text) !important; border-color: var(--border) !important; }
            `;
            (doc.head || doc.documentElement).appendChild(styleEl);
          }
        } else {
          if(styleEl) styleEl.remove();
        }

        // Also set body background inline to ensure it overrides utility classes when needed
        try{
          const rootStyles = getComputedStyle(document.documentElement);
          const bg = rootStyles.getPropertyValue('--background') || '';
          if(bg) doc.body.style.background = enabled ? bg.trim() : '';
        }catch(e){}

      }catch(err){
        alert('Не удалось переключить тему в iframe — убедитесь, что вы открыли страницу через http://localhost и что iframe доступен.');
      }
    });
  }
}

function toggleFilterClass(cls,on){ const el=document.getElementById('preview-area'); if(on) el.classList.add(cls); else el.classList.remove(cls); }

window.addEventListener('DOMContentLoaded',setup);

// Helper: mix two hex colors (t from 0..1)
function mixHex(hex1, hex2, t){
  const a = hexToRgb(hex1); const b = hexToRgb(hex2);
  const r = Math.round(a[0] + (b[0]-a[0])*t);
  const g = Math.round(a[1] + (b[1]-a[1])*t);
  const bl = Math.round(a[2] + (b[2]-a[2])*t);
  return '#'+[r,g,bl].map(x=>x.toString(16).padStart(2,'0')).join('');
}

// Suggest replacement by blending foreground towards black or white until requirement met
function suggestReplacement(fg,bg,requirement){
  for(let i=1;i<=10;i++){
    const candidate = mixHex(fg,'#000000', i/10);
    try{ if(contrastRatio(candidate,bg) >= requirement) return candidate; }catch(e){}
  }
  for(let i=1;i<=10;i++){
    const candidate = mixHex(fg,'#ffffff', i/10);
    try{ if(contrastRatio(candidate,bg) >= requirement) return candidate; }catch(e){}
  }
  return '';
}

// ---------- Color-blind simulation and state checks ----------
function rgbToHex(r,g,b){ return '#'+[r,g,b].map(x=>Math.round(x).toString(16).padStart(2,'0')).join(''); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

const CB_MATRICES = {
  protan: [[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],
  deutan: [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]],
  tritan: [[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]]
};

function applyMatrixToRgb(rgb, matrix){
  const [r,g,b] = rgb.map(v=>v/255);
  const rr = clamp((matrix[0][0]*r + matrix[0][1]*g + matrix[0][2]*b)*255, 0, 255);
  const gg = clamp((matrix[1][0]*r + matrix[1][1]*g + matrix[1][2]*b)*255, 0, 255);
  const bb = clamp((matrix[2][0]*r + matrix[2][1]*g + matrix[2][2]*b)*255, 0, 255);
  return [Math.round(rr), Math.round(gg), Math.round(bb)];
}

function simulateColorBlind(hex, type){
  try{
    const rgb = hexToRgb(hex);
    const m = CB_MATRICES[type];
    if(!m) return hex;
    const out = applyMatrixToRgb(rgb, m);
    return rgbToHex(out[0], out[1], out[2]);
  }catch(e){ return hex; }
}

// Parse rgb/rgba string into [r,g,b]
function parseRgbString(s){
  if(!s) return null;
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if(!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function rgbStringToHex(s){
  const arr = parseRgbString(s);
  if(!arr) return null;
  return rgbToHex(arr[0], arr[1], arr[2]);
}

// Check mobile touch targets, font sizes and contrast inside #mobile-preview
function checkMobileTargets(){
  const container = document.getElementById('mobile-preview');
  const out = document.getElementById('mobile-check-results');
  if(!container || !out) return;
  const buttons = container.querySelectorAll('.mobile-card .btn');
  if(!buttons.length){ out.textContent = 'Кнопки не найдены в превью.'; return; }
  const rootVars = getRootVars();
  const defaultCardBg = rootVars['--card'] || '#ffffff';
  const results = [];
  buttons.forEach((btn, idx)=>{
    const rect = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    let bg = cs.backgroundColor;
    if(!bg || bg==='transparent' || bg==='rgba(0, 0, 0, 0)') bg = defaultCardBg;
    const fg = cs.color || '#000000';
    const bgHex = rgbStringToHex(bg) || (bg.startsWith('#')? bg : defaultCardBg);
    const fgHex = rgbStringToHex(fg) || (fg.startsWith('#')? fg : '#000000');
    let contrast = 'err';
    try{ contrast = formatRatio(contrastRatio(fgHex, bgHex)); }catch(e){ contrast = 'err'; }
    const width = Math.round(rect.width); const height = Math.round(rect.height);
    const okSize = (width >= 44 && height >= 44);
    const fontSize = parseFloat(cs.fontSize || 0);
    results.push({idx, text: btn.textContent.trim().slice(0,30) || btn.getAttribute('aria-label') || `button-${idx+1}`, width, height, okSize, fontSize, contrast, fgHex, bgHex});
  });

  // render
  let html = '';
  results.forEach(r=>{
    html += `<div>«${r.text}»: size ${r.width}×${r.height}px — ${r.okSize? '<strong style="color:green">OK</strong>' : '<strong style="color:#d93025">TOO SMALL</strong>'}; font ${r.fontSize}px; contrast ${r.contrast} (fg ${r.fgHex} / bg ${r.bgHex})</div>`;
  });
  html += '<div class="small" style="margin-top:6px">Рекомендация: целевые сенсорные размеры ≥44×44 CSS px; текст на кнопках должен иметь контраст ≥ 4.5:1 (или ≥3 для крупных).</div>';
  out.innerHTML = html;
}

function darkenHex(hex, amt){ // amt 0..1
  const [r,g,b] = hexToRgb(hex);
  const nr = Math.round(r*(1-amt)); const ng = Math.round(g*(1-amt)); const nb = Math.round(b*(1-amt));
  return rgbToHex(nr,ng,nb);
}
function lightenHex(hex, amt){ const [r,g,b]=hexToRgb(hex); const nr=Math.round(r + (255-r)*amt); const ng=Math.round(g + (255-g)*amt); const nb=Math.round(b + (255-b)*amt); return rgbToHex(nr,ng,nb); }

function mixHexLocal(a,b,t){ // reuse mixHex name avoided
  const aa = hexToRgb(a); const bb = hexToRgb(b);
  const r = Math.round(aa[0] + (bb[0]-aa[0])*t);
  const g = Math.round(aa[1] + (bb[1]-aa[1])*t);
  const bl = Math.round(aa[2] + (bb[2]-aa[2])*t);
  return rgbToHex(r,g,bl);
}

function buildStateVariants(fg,bg){
  // default, hover (bg darker), pressed (bg darker more), disabled (fg blended to bg)
  return {
    default: {fg, bg},
    hover: {fg, bg: darkenHex(bg, 0.08)},
    pressed: {fg, bg: darkenHex(bg, 0.18)},
    disabled: {fg: mixHexLocal(fg, bg, 0.6), bg: bg}
  };
}

function getRootVars(){
  const cs = getComputedStyle(document.documentElement);
  const keys = ['--primary','--primary-light','--secondary','--background','--card','--text','--text-light','--border','--sidebar-bg','--brand-a11y'];
  const map = {};
  keys.forEach(k=>{ let v = cs.getPropertyValue(k); if(v) map[k]=v.trim(); });
  return map;
}

function generateA11yPalette(){
  const vars = getRootVars();
  const palette = {};
  // prefer explicit brand-a11y for primary if present
  palette['--primary'] = vars['--brand-a11y'] || vars['--primary'];
  // for primary-light and secondary try to ensure contrast with card/background
  const bg = vars['--background'] || '#ffffff';
  palette['--primary-light'] = suggestReplacement(vars['--primary-light']||vars['--primary'], bg, 4.5) || vars['--primary-light'] || vars['--primary'];
  palette['--secondary'] = suggestReplacement(vars['--secondary']||'#84cc16', bg, 4.5) || vars['--secondary'];
  // text colors: ensure dark text on light bg and white text on dark card
  palette['--text'] = suggestReplacement(vars['--text']||'#374151', vars['--card']||'#ffffff', 4.5) || vars['--text']||'#111827';
  palette['--text-light'] = suggestReplacement(vars['--text-light']||'#6b7280', vars['--card']||'#ffffff', 3) || vars['--text-light'];
  palette['--background'] = vars['--background'] || '#ffffff';
  palette['--card'] = vars['--card'] || '#ffffff';
  palette['--border'] = suggestReplacement(vars['--border']||'#e5e7eb', palette['--card'], 3) || vars['--border'];
  palette['--sidebar-bg'] = suggestReplacement(vars['--sidebar-bg']||'#334155', '#ffffff', 4.5) || vars['--sidebar-bg'];
  // store globally for apply
  window._lastA11yPalette = palette;
  return palette;
}

function applyA11yToPreview(){
  const palette = window._lastA11yPalette || generateA11yPalette();
  const after = document.getElementById('mock-after');
  if(!after) return;
  // set inline CSS variables on the after mock so it renders with A11y palette
  Object.keys(palette).forEach(k=>{ after.style.setProperty(k, palette[k]); });
  after.classList.add('a11y-override');
  // update report area briefly
  const res = document.getElementById('detailed-results'); if(res) res.innerHTML = '<div class="small">A11y palette applied to After preview. Проверьте визуально и запустите Run detailed checks для новых метрик.</div>';
}

function resetPreviews(){
  const after = document.getElementById('mock-after');
  if(!after) return;
  after.removeAttribute('style'); after.classList.remove('a11y-override');
  const res = document.getElementById('detailed-results'); if(res) res.innerHTML = '<div class="small">Превью сброшено к оригиналу.</div>';
}

function checkDetailed(){
  const rows = document.querySelectorAll('.color-row');
  const results = [];
  rows.forEach(row=>{
    const name = row.querySelector('.cname').value || row.querySelector('.cname').placeholder;
    const fg = row.querySelector('.fg').value;
    const bg = row.querySelector('.bg').value;
    const type = row.querySelector('.sizeType').value;
    const req = type==='large'?3:4.5;
    const origRatio = (()=>{ try{return contrastRatio(fg,bg);}catch(e){return 0;} })();
    // simulate color blindness
    const prot = simulateColorBlind(fg,'protan'); const prot_bg = simulateColorBlind(bg,'protan'); const protRatio = (()=>{ try{return contrastRatio(prot,prot_bg);}catch(e){return 0;} })();
    const deut = simulateColorBlind(fg,'deutan'); const deut_bg = simulateColorBlind(bg,'deutan'); const deutRatio = (()=>{ try{return contrastRatio(deut,deut_bg);}catch(e){return 0;} })();
    const trit = simulateColorBlind(fg,'tritan'); const trit_bg = simulateColorBlind(bg,'tritan'); const tritRatio = (()=>{ try{return contrastRatio(trit,trit_bg);}catch(e){return 0;} })();
    // states check (use foreground on background)
    const states = buildStateVariants(fg,bg);
    const stateRatios = {};
    Object.keys(states).forEach(s=>{ try{ stateRatios[s] = formatRatio(contrastRatio(states[s].fg, states[s].bg)); }catch(e){ stateRatios[s] = 'err'; } });
    // also check same states in dark theme: simulate flipping theme by using a11y overrides if present
    const rootVars = getRootVars(); const darkPalette = Object.assign({}, rootVars);
    // assume dark theme values from :root.a11y mapping (computed) — attempt to read computed style when class a11y is present
    document.documentElement.classList.add('a11y');
    const darkVars = getRootVars();
    document.documentElement.classList.remove('a11y');
    // compute ratios using dark theme variables where relevant (use text/bg swap)
    const darkBg = darkVars['--background'] || bg;
    const darkCard = darkVars['--card'] || bg;
    const darkStates = buildStateVariants(fg, darkBg);
    const darkStateRatios = {}; Object.keys(darkStates).forEach(s=>{ try{ darkStateRatios[s] = formatRatio(contrastRatio(darkStates[s].fg, darkStates[s].bg)); }catch(e){ darkStateRatios[s] = 'err'; } });

    // recommendation
    let recommendation = '';
    if(origRatio < req){ recommendation = row.dataset.suggested || suggestReplacement(fg,bg,req) || '' }

    results.push({name,fg,bg,type,req,origRatio:formatRatio(origRatio),protRatio:formatRatio(protRatio),deutRatio:formatRatio(deutRatio),tritRatio:formatRatio(tritRatio),stateRatios,darkStateRatios,recommendation});
  });

  // render results into detailed-results
  const out = document.getElementById('detailed-results');
  if(!out) return;
  let html = '<h4>Результаты проверки по парам цветов</h4>';
  html += '<table class="table"><thead><tr><th>Пара</th><th>Контраст</th><th>Protan</th><th>Deutan</th><th>Tritan</th><th>States (hover/pressed/disabled)</th><th>Dark states</th><th>Recommendation</th></tr></thead><tbody>';
  results.forEach(r=>{
    html += `<tr><td>${r.name}</td><td>${r.origRatio} (req ≥ ${r.req})</td><td>${r.protRatio}</td><td>${r.deutRatio}</td><td>${r.tritRatio}</td><td>hover:${r.stateRatios.hover}, pressed:${r.stateRatios.pressed}, disabled:${r.stateRatios.disabled}</td><td>hover:${r.darkStateRatios.hover}, pressed:${r.darkStateRatios.pressed}, disabled:${r.darkStateRatios.disabled}</td><td>${r.recommendation? `<span class='color-swatch' style='background:${r.recommendation}'></span> ${r.recommendation}` : '—'}</td></tr>`;
  });
  html += '</tbody></table>';

  html += '<div class="small" style="margin-top:8px">Примените A11y‑палитру к разделу "After" и снова запустите проверку, чтобы увидеть метрики для альтернативной палитры.</div>';
  out.innerHTML = html;
}

// ---------- Typography scan: load desktop pages into hidden iframes and analyze ----------
const PAGES_TO_SCAN = [
  '../desktop/index.html',
  '../desktop/journal.html',
  '../desktop/grades.html',
  '../desktop/notifications.html',
  '../desktop/login.html'
];

function scanTypography(){
  const reportEl = document.getElementById('typography-report');
  reportEl.innerHTML = 'Запуск сканирования...';
  const results = [];
  let loaded = 0;
  const container = document.createElement('div'); container.id = 'scan-iframes'; document.body.appendChild(container);

  PAGES_TO_SCAN.forEach((path)=>{
    const iframe = document.createElement('iframe');
    iframe.src = path;
    iframe.style.width = '1024px'; iframe.style.height = '600px'; iframe.style.position='absolute'; iframe.style.left='-9999px';
    container.appendChild(iframe);
    iframe.addEventListener('load', ()=>{
      try{
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        // collect headings and paragraphs
        const h1s = doc.querySelectorAll('h1');
        const h2s = doc.querySelectorAll('h2');
        const h3s = doc.querySelectorAll('h3');
        const ps = doc.querySelectorAll('p');
        // analyze sizes and line-heights using computed styles
        const issues = [];
        const measured = {h1:[], h2:[], h3:[], p:[]};
        function analyzeNodeList(list, name){
          list.forEach(el=>{
            const cs = iframe.contentWindow.getComputedStyle(el);
            const fontSize = parseFloat(cs.fontSize);
            const lineHeight = cs.lineHeight === 'normal' ? fontSize*1.2 : parseFloat(cs.lineHeight);
            const lhRatio = lineHeight / fontSize;
            // record measured sizes for hierarchy checks
            if(name==='h1' || name==='h2' || name==='h3' || name==='p'){
              measured[name].push({text: el.textContent.trim().slice(0,40), fontSize, lineHeight, lhRatio, fontWeight: cs.fontWeight});
            }
            if(lhRatio < 1.4 && fontSize>=12){
              issues.push(`${name}: элемент «${el.textContent.trim().slice(0,30)}» — line-height ${lhRatio.toFixed(2)} < 1.4`);
            }
            // check line length estimation for paragraphs
            if(name==='p'){
              const cw = el.clientWidth || el.getBoundingClientRect().width;
              // estimate average char width by measuring the width of sample text
              const sample = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
              const span = doc.createElement('span'); span.style.visibility='hidden'; span.style.whiteSpace='nowrap'; span.style.font=cs.font; span.textContent = sample; doc.body.appendChild(span);
              const sampleWidth = span.getBoundingClientRect().width || 1; span.remove();
              const avgChar = sampleWidth / sample.length;
              const charsPerLine = Math.round(cw / avgChar);
              if(charsPerLine > 75){
                issues.push(`p: длинная строка (~${charsPerLine} символов) — рассмотрите ограничение ширины или увеличение колонки`);
              }
            }
          });
        }
        analyzeNodeList(h1s,'h1'); analyzeNodeList(h2s,'h2'); analyzeNodeList(h3s,'h3'); analyzeNodeList(ps,'p');
        // hierarchy checks: average font sizes
        function avg(arr, key){ if(!arr.length) return 0; return arr.reduce((s,x)=>s+x[key],0)/arr.length; }
        const avgH1 = avg(measured.h1, 'fontSize');
        const avgH2 = avg(measured.h2, 'fontSize');
        const avgH3 = avg(measured.h3, 'fontSize');
        const avgP = avg(measured.p, 'fontSize');
        if(avgH1 && avgH2 && avgH3){
          if(!(avgH1>avgH2 && avgH2>avgH3 && avgH3>avgP)){
            issues.push(`Иерархия шрифтов: ожидается H1 > H2 > H3 > Body. Найдено: H1=${avgH1.toFixed(1)}px, H2=${avgH2.toFixed(1)}px, H3=${avgH3.toFixed(1)}px, Body=${avgP.toFixed(1)}px`);
          }
        }
        // boldness check: headings should be heavier than body
        function avgW(arr){ if(!arr.length) return 0; return arr.reduce((s,x)=>s+parseInt(x.fontWeight||400),0)/arr.length; }
        const avgW_h1 = avgW(measured.h1); const avgW_p = avgW(measured.p);
        if(avgW_h1 && avgW_p && avgW_h1 <= avgW_p){ issues.push(`Толщина шрифта: H1 не жирнее body (h1=${Math.round(avgW_h1)}, body=${Math.round(avgW_p)})`); }

        // collect usage of text-size utility classes (Tailwind) to make Text Styles audit
        const allTextClasses = {};
        const allNodes = doc.querySelectorAll('*');
        allNodes.forEach(n=>{
          const cls = n.className || '';
          if(typeof cls === 'string' && cls.includes('text-')){
            cls.split(/\s+/).forEach(c=>{ if(c.startsWith('text-')) allTextClasses[c] = (allTextClasses[c]||0)+1; });
          }
        });
        const inlineStyled = doc.querySelectorAll('[style]') || [];

        results.push({path, h1: h1s.length, h2: h2s.length, h3: h3s.length, p: ps.length, issues, textClasses: allTextClasses, inlineCount: inlineStyled.length, measured});
      }catch(e){ results.push({path, error: String(e)}); }
      loaded++; if(loaded===PAGES_TO_SCAN.length) renderTypographyReport(results, container);
    }, {once:true});
  });
}

function renderTypographyReport(results, container){
  const reportEl = document.getElementById('typography-report');
  let html = '';
  results.forEach(r=>{
    if(r.error){ html += `<div class="report-item"><strong>${r.path}</strong>: Ошибка загрузки — ${r.error}</div>`; return; }
    html += `<div class="report-item"><strong>Страница:</strong> ${r.path}<ul class='report-list'>`;
    html += `<li>H1: ${r.h1}, H2: ${r.h2}, H3: ${r.h3}, параграфов: ${r.p}</li>`;
    // show measured averages if available
    if(r.measured){
      const avg = (arr, key)=> arr&&arr.length? (arr.reduce((s,x)=>s+x[key],0)/arr.length).toFixed(1) : '—';
      html += `<li class='small'>Средние размеры (px): H1 ${avg(r.measured.h1,'fontSize')}, H2 ${avg(r.measured.h2,'fontSize')}, H3 ${avg(r.measured.h3,'fontSize')}, Body ${avg(r.measured.p,'fontSize')}</li>`;
      // boldness check summary
      const avgW = arr=> arr&&arr.length? Math.round(arr.reduce((s,x)=>s+parseInt(x.fontWeight||400),0)/arr.length) : '—';
      html += `<li class='small'>Средняя толщина шрифта: H1 ${avgW(r.measured.h1)}, Body ${avgW(r.measured.p)}</li>`;
    }
    if(r.issues.length) html += `<li class='small'>Проблемы: <ul>${r.issues.map(i=>`<li>${i}</li>`).join('')}</ul></li>`;
    else html += `<li class='small'>Проблемы не обнаружены</li>`;
    // text styles summary
    const classes = Object.keys(r.textClasses||{}).map(k=>`${k} (${r.textClasses[k]})`).join(', ');
    html += `<li class='small'>Используемые текстовые классы: ${classes || 'нет явных text-* классов'}</li>`;
    html += `<li class='small'>Inline styles (атрибут style) найдено: ${r.inlineCount || 0} — рекомендуется избегать инлайнового стайлинга и использовать Text Styles / CSS</li>`;
    html += `</ul></div>`;
  });
  html += `<div class='small'>Рекомендации: используйте единый набор Text Styles (Display/H1/H2/Body/Caption) вместо множества утилитарных размеров; укажите line-height ≥ 1.4 для body и проверьте длину строки ≤ 75 символов.</div>`;
  reportEl.innerHTML = html;
  // cleanup iframes
  container.remove();
}
