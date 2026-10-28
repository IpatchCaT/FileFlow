<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FileFlow</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<style>
:root{--bg:#e9efed;--panel:#fff;--ink:#12302f;--mute:#5d7573;--line:#c9d6d3;--btn:#12302f;--btnt:#fff;--acc:#e0912f;--hl:#ffe08a;--err:#b3261e;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1919;--panel:#162424;--ink:#dcebe8;--mute:#8fa9a5;--line:#2c4240;--btn:#5cc4b4;--btnt:#08201d;--hl:#6b5514;--err:#ff8a80;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f1919;--panel:#162424;--ink:#dcebe8;--mute:#8fa9a5;--line:#2c4240;--btn:#5cc4b4;--btnt:#08201d;--hl:#6b5514;--err:#ff8a80;color-scheme:dark}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "Atkinson Hyperlegible",system-ui,sans-serif;min-height:100vh}
h1,h2,.brand{font-family:"Bricolage Grotesque","Atkinson Hyperlegible",system-ui,sans-serif;margin:0}
.app{display:grid;grid-template-columns:200px 1fr;min-height:100vh}
aside{background:var(--panel);border-right:1px solid var(--line);padding:18px 12px;display:flex;flex-direction:column;gap:4px}
.brand{font-size:22px;font-weight:700;padding:0 8px 14px}
nav button{all:unset;box-sizing:border-box;display:block;width:100%;padding:9px 10px;border-radius:6px;cursor:pointer;border-left:4px solid transparent}
nav button:hover{background:var(--bg)}
nav button.on{border-left-color:var(--acc);background:var(--bg);font-weight:700}
main{padding:18px 24px;min-width:0}
.top{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap}
.top .r{display:flex;gap:8px;align-items:center;color:var(--mute)}
section{display:none}section.on{display:block}
h2{font-size:24px;margin-bottom:4px}
.lead{color:var(--mute);margin:0 0 14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:14px}
button,select,input,textarea{font:inherit;color:inherit}
.b{background:var(--btn);color:var(--btnt);border:1px solid var(--btn);border-radius:6px;padding:7px 12px;cursor:pointer;font-weight:700}
.b.g{background:transparent;color:var(--ink);border-color:var(--line)}
.b.d{color:var(--err);background:transparent;border-color:var(--line)}
.b:disabled{opacity:.45;cursor:not-allowed}
.b:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible,nav button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}
select,input[type=text],textarea{background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px 8px}
textarea{width:100%;min-height:150px;resize:vertical}
.drop{border:2px dashed var(--line);border-radius:8px;padding:26px;text-align:center;color:var(--mute)}
.drop.over{border-color:var(--acc);background:var(--bg)}
table{border-collapse:collapse;width:100%}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
.sc{overflow-x:auto;max-height:340px;overflow-y:auto}
th.s{cursor:pointer;position:sticky;top:0;background:var(--panel)}
mark{background:var(--hl);color:inherit;padding:0 2px;border-radius:2px}
.sm{color:var(--mute);font-size:13px}
ul.l{list-style:none;margin:0;padding:0}
ul.l li{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)}
ul.l li span:first-child{flex:1;overflow-wrap:anywhere}
ul.l li button{background:none;border:1px solid var(--line);border-radius:4px;cursor:pointer;padding:0 7px}
.empty{color:var(--mute)}
.bar{height:6px;background:var(--line);border-radius:3px;overflow:hidden;display:none}.bar i{display:block;height:100%;width:0;background:var(--acc)}
#toasts{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:6px;z-index:20}
.toast{background:var(--btn);color:var(--btnt);padding:9px 13px;border-radius:6px;max-width:320px}.toast.err{background:var(--err);color:#fff}
dialog{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:8px;max-width:min(680px,92vw)}
dialog pre{white-space:pre-wrap;max-height:55vh;overflow:auto;margin:0 0 10px}dialog img{max-width:100%}
@media (max-width:760px){.app{grid-template-columns:1fr}aside{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--line);padding:8px}.brand{display:none}nav{display:flex;gap:4px}nav button{white-space:nowrap;width:auto;border-left:0;border-bottom:3px solid transparent}nav button.on{border-bottom-color:var(--acc)}main{padding:14px}}
</style>
</head>
<body>
<div class="app">
<aside><div class="brand">FileFlow</div>
<nav id="nav"><button data-t="lib" class="on">Library</button><button data-t="merge">Merge</button><button data-t="conv">Convert</button><button data-t="ext">Extract</button><button data-t="sort">Data Sorter</button></nav></aside>
<main>
<div class="top"><h1 style="font-size:15px;color:var(--mute);font-weight:500">Your files stay in this browser. Nothing is uploaded.</h1>
<div class="r"><span id="used">0 KB used</span><button class="b g" id="clr">Clear cache</button><button class="b g" id="theme" title="Switch light or dark mode">Theme</button></div></div>

<section id="s-lib" class="on"><h2>Library</h2><p class="lead">Upload files once. They are saved in your browser cache and stay after a refresh.</p>
<div class="card"><div class="drop" id="drop">Drop files here, or <button class="b" id="browse">Browse files</button><input type="file" id="fi" multiple hidden accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.json,image/*"><div class="sm">Excel, CSV, PDF, Word (.docx), text, JSON, images</div></div></div>
<div class="card"><div class="row"><b>Send ticked files to:</b><button class="b g" data-go="merge">Merge</button><button class="b g" data-go="conv">Convert</button><button class="b g" data-go="ext">Extract</button><button class="b g" data-go="sort">Data Sorter</button></div>
<div class="sc"><table><thead><tr><th></th><th>Name</th><th>Type</th><th>Size</th><th>Added</th><th></th></tr></thead><tbody id="libB"></tbody></table></div></div></section>

<section id="s-merge"><h2>Merge</h2><p class="lead">Combine the selected files in the order shown.</p>
<div class="card"><ul class="l" id="mList"></ul>
<div class="row"><select id="mMode"><option value="pdf">PDFs into one PDF</option><option value="stack">Excel/CSV into one sheet (stack rows)</option><option value="book">Excel/CSV into one workbook (sheet per file)</option><option value="txt">Text/Word/PDF into one text file</option></select>
<label><input type="checkbox" id="mHead" checked> Keep headers once</label></div>
<div class="row"><button class="b" id="mGo">Merge</button><button class="b g" id="mDl" disabled title="Merge first">Download result</button><button class="b g" id="mSave" disabled title="Merge first">Save to Library</button></div>
<div class="bar" id="mBar"><i></i></div><div class="sm" id="mInfo">No result yet.</div></div></section>

<section id="s-conv"><h2>Convert</h2><p class="lead">Only formats that work for every selected file are enabled.</p>
<div class="card"><ul class="l" id="cList"></ul>
<div class="row"><label>Convert to <select id="cT"></select></label><button class="b" id="cGo">Convert</button><button class="b g" id="cZip" disabled title="Convert two or more files first">Download all (ZIP)</button></div>
<div class="bar" id="cBar"><i></i></div><ul class="l" id="cRes"></ul></div></section>

<section id="s-ext"><h2>Extract to text</h2><p class="lead">Pull the text out of PDF, Word, Excel and text files.</p>
<div class="card"><ul class="l" id="eList"></ul>
<div class="row"><label><input type="checkbox" id="eSep" checked> Add page/sheet/file separators</label><button class="b" id="eGo">Extract</button></div>
<textarea id="eTxt" placeholder="Extracted text appears here. You can edit it."></textarea>
<div class="row"><button class="b g" id="eCopy">Copy</button><button class="b g" id="eDl">Download .txt</button><button class="b g" id="eClr">Clear</button><span class="sm" id="eCnt">0 words, 0 characters</span></div></div></section>

<section id="s-sort"><h2>Data Sorter</h2><p class="lead">Search a spreadsheet and collect the matches into one column or one block of text.</p>
<div class="card"><div class="row"><select id="sFile"></select><select id="sSheet"></select><span class="sm" id="sInfo">Add an Excel or CSV file in the Library first.</span></div>
<div class="row"><textarea id="sKw" style="min-height:70px;flex:1;min-width:220px" placeholder="Keywords, one per line"></textarea>
<div><div class="sm">Search columns (none = all)</div><select id="sCols" multiple size="4"></select></div></div>
<div class="row"><select id="sMode"><option value="has">contains</option><option value="exact">exact</option><option value="starts">starts with</option><option value="regex">regex</option></select>
<label><input type="checkbox" id="sCase"> Case sensitive</label>
<button class="b" id="sGo">Search</button><button class="b g" id="sReset">Reset</button></div>
<div class="sc"><table><thead id="sH"></thead><tbody id="sB"></tbody></table></div></div>
<div class="card"><div class="row"><label>Output <select id="sOM"><option value="col">Single column (one per line)</option><option value="txt">Single text block</option><option value="table">Filtered table</option></select></label>
<label>Separator <select id="sSep"><option value="nl">New line</option><option value="comma">Comma</option><option value="tab">Tab</option><option value="custom">Custom</option></select></label><input type="text" id="sCust" placeholder="custom" size="6">
<label><input type="checkbox" id="sDup"> Remove duplicates</label>
<select id="sSort"><option value="">No sorting</option><option value="az">Sort A-Z</option><option value="za">Sort Z-A</option></select></div>
<textarea id="sTxt" placeholder="Results appear here."></textarea>
<div class="row"><span class="sm" id="sCnt"></span><button class="b g" id="sCopy">Copy result</button><button class="b g" id="sX">Download .xlsx</button><button class="b g" id="sC">Download .csv</button><button class="b g" id="sT">Download .txt</button></div></div></section>
</main></div>
<dialog id="dlg"><div id="dBody"></div><button class="b" id="dClose">Close</button></dialog>
<div id="toasts"></div>
<script>
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let F=[],sel=[],db=null,M=null,CR=[],DL=undefined;
const ext=n=>(n.split('.').pop()||'').toLowerCase(),get=i=>F.find(f=>f.id===i);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=b=>b>1e6?(b/1e6).toFixed(1)+' MB':Math.max(1,Math.round(b/1e3))+' KB';
function toast(m,e){const t=document.createElement('div');t.className='toast'+(e?' err':'');t.textContent=m;$('#toasts').append(t);setTimeout(()=>t.remove(),4500)}
async function run(b,fn){if(b)b.disabled=true;try{await fn()}catch(e){toast(e.message||String(e),1)}finally{if(b)b.disabled=false}}
try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}catch(e){}
async function dl(data,name){if(DL===undefined){try{DL=await claude.use('downloads')}catch(e){DL=null}}
 if(DL){try{await DL.save({filename:name,data});toast('Saved '+name)}catch(e){if(e.code!=='declined')toast('Could not save: '+(e.message||e.code),1)}return}
 const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data]));a.download=name;a.click()}
/* storage */
function openDB(){return new Promise(r=>{try{const q=indexedDB.open('fileflow',1);q.onupgradeneeded=()=>q.result.createObjectStore('files',{keyPath:'id'});q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}})}
const tx=(m,fn)=>new Promise(r=>{if(!db)return r(null);try{const q=fn(db.transaction('files',m).objectStore('files'));q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
async function add(blob,name){if(F.some(f=>f.name===name)){const e=ext(name),b=name.slice(0,-e.length-1);let i=2;while(F.some(f=>f.name===`${b} (${i}).${e}`))i++;name=`${b} (${i}).${e}`}
 const f={id:crypto.randomUUID(),name,size:blob.size,time:Date.now(),blob};F.push(f);await tx('readwrite',s=>s.put(f));return f}
const OK=['xlsx','xls','csv','pdf','docx','txt','json','png','jpg','jpeg','gif','webp'];
async function upload(list){for(const f of list){const e=ext(f.name);
 if(!f.size){toast(f.name+' is empty.',1);continue}
 if(!OK.includes(e)){toast(`.${e} files aren’t supported (${f.name}).`,1);continue}
 if(f.size>50e6)toast(f.name+' is large and may be slow to process.');
 await add(f,f.name)}renderAll();toast('Upload complete')}
/* rendering */
function renderLib(){$('#libB').innerHTML=F.length?F.map(f=>`<tr><td><input type="checkbox" data-id="${f.id}" ${sel.includes(f.id)?'checked':''} aria-label="Select ${esc(f.name)}"></td><td>${esc(f.name)}</td><td>${ext(f.name)}</td><td>${fmt(f.size)}</td><td class="sm">${new Date(f.time).toLocaleString()}</td><td style="white-space:nowrap"><button class="b g" data-a="pv" data-id="${f.id}">Preview</button> <button class="b g" data-a="dl" data-id="${f.id}">Download</button> <button class="b d" data-a="del" data-id="${f.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No files yet. Drop some above.</td></tr>';
 $('#used').textContent=fmt(F.reduce((a,f)=>a+f.size,0))+' used'}
const TG={xlsx:['csv','json','xlsx','pdf'],xls:['csv','json','xlsx','pdf'],csv:['xlsx','json','pdf'],json:['xlsx','csv'],docx:['txt','html'],pdf:['txt'],txt:['pdf'],png:['pdf'],jpg:['pdf'],jpeg:['pdf']};
function renderSel(){sel=sel.filter(get);['mList','cList','eList'].forEach(id=>{$('#'+id).innerHTML=sel.length?sel.map((i,n)=>{const f=get(i);return `<li><span>${esc(f.name)}</span><span class="sm">${fmt(f.size)}</span><button data-a="up" data-n="${n}" title="Move up">↑</button><button data-a="dn" data-n="${n}" title="Move down">↓</button><button data-a="rm" data-n="${n}" title="Remove from selection">✕</button></li>`}).join(''):'<li class="empty">No files selected. Tick files in the Library, then send them here.</li>'});
 const fs=sel.map(get),com=fs.length?fs.map(f=>TG[ext(f.name)]||[]).reduce((a,b)=>a.filter(x=>b.includes(x))):[];
 $('#cT').innerHTML=['txt','csv','json','xlsx','pdf','html'].map(t=>`<option value="${t}" ${com.includes(t)?'':'disabled'}>${t.toUpperCase()}</option>`).join('');
 const first=com[0];if(first)$('#cT').value=com.includes('pdf')&&!first?'pdf':first;
 $('#cGo').disabled=!com.length;$('#cGo').title=com.length?'':'Select files that share a conversion, e.g. all spreadsheets.'}
function renderAll(){renderLib();renderSel();fillSorter()}
function go(t){$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('section').forEach(s=>s.classList.toggle('on',s.id==='s-'+t));if(t==='sort')fillSorter(true)}
/* readers */
async function pdfText(buf,sep){let d;try{d=await pdfjsLib.getDocument({data:buf}).promise}catch(e){throw new Error(e.name==='PasswordException'?'This PDF is password-protected. Remove the password first.':'Could not read this PDF.')}
 const out=[];let any=false;for(let i=1;i<=d.numPages;i++){const c=await(await d.getPage(i)).getTextContent(),t=c.items.map(x=>x.str).join(' ').trim();if(t)any=true;out.push((sep?`--- Page ${i} ---\n`:'')+t)}
 if(!any)throw new Error('No selectable text found. This looks like a scanned PDF, so OCR is needed.');return out.join('\n\n')}
async function getText(f,sep=true){const e=ext(f.name),b=await f.blob.arrayBuffer();
 if(e==='pdf')return pdfText(b,sep);
 if(e==='docx')return(await mammoth.extractRawText({arrayBuffer:b})).value;
 if(['xlsx','xls','csv'].includes(e)){const wb=XLSX.read(b,{type:'array'});return wb.SheetNames.map(n=>(sep?`--- Sheet: ${n} ---\n`:'')+XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n')}
 if(['txt','json'].includes(e))return new TextDecoder().decode(b);
 throw new Error(`Can’t extract text from .${e} files.`)}
/* merge */
function bar(id,p){const b=$(id);b.style.display=p>=1||p<0?'none':'block';b.firstChild.style.width=p*100+'%'}
async function doMerge(){const fs=sel.map(get);if(fs.length<2)throw new Error('Select at least two files in the Library.');const m=$('#mMode').value;let blob,name,info;
 if(m==='pdf'){const out=await PDFLib.PDFDocument.create();for(const f of fs){if(ext(f.name)!=='pdf')throw new Error(f.name+' is not a PDF.');let d;try{d=await PDFLib.PDFDocument.load(await f.blob.arrayBuffer())}catch(e){throw new Error(f.name+' can’t be read (password-protected or damaged).')}
  (await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p));bar('#mBar',.5)}
  blob=new Blob([await out.save()],{type:'application/pdf'});name='merged.pdf';info=out.getPageCount()+' pages'}
 else if(m==='txt'){const t=[];for(const f of fs)t.push((`--- ${f.name} ---\n`)+await getText(f,false));blob=new Blob([t.join('\n\n')],{type:'text/plain'});name='merged.txt';info=t.join('').length+' characters'}
 else{const book=XLSX.utils.book_new();let rows=[],n=0;
  for(const f of fs){if(!['xlsx','xls','csv'].includes(ext(f.name)))throw new Error(f.name+' is not a spreadsheet.');const wb=XLSX.read(await f.blob.arrayBuffer(),{type:'array'});
   if(m==='stack'){const a=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});rows=rows.concat($('#mHead').checked&&rows.length?a.slice(1):a)}
   else{let s=f.name.replace(/\.[^.]+$/,'').replace(/[\[\]\*\?:\/\\]/g,'').slice(0,28)||'Sheet',k=s,i=2;while(book.SheetNames.includes(k))k=s+i++;XLSX.utils.book_append_sheet(book,wb.Sheets[wb.SheetNames[0]],k);n++}}
  if(m==='stack'){XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),'Merged');info=rows.length+' rows'}else info=n+' sheets';
  blob=new Blob([XLSX.write(book,{type:'array',bookType:'xlsx'})]);name='merged.xlsx'}
 M={blob,name};bar('#mBar',1);$('#mInfo').textContent=`Result: ${name}, ${info}, ${fmt(blob.size)}.`;$('#mDl').disabled=$('#mSave').disabled=false;$('#mDl').title=$('#mSave').title=''}
/* convert */
function textPdf(t){const d=new jspdf.jsPDF();d.setFontSize(9);let y=15;d.splitTextToSize(t,180).forEach(l=>{if(y>285){d.addPage();y=15}d.text(l,15,y);y+=4.5});return d.output('blob')}
async function imgPdf(f){const u=await new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f.blob)});
 const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(f.name+' can’t be read as an image.'));i.src=u});
 const d=new jspdf.jsPDF({unit:'mm',format:'a4',orientation:im.width>im.height?'l':'p'}),W=d.internal.pageSize.getWidth()-20,H=d.internal.pageSize.getHeight()-20,s=Math.min(W/im.width,H/im.height);
 d.addImage(u,ext(f.name)==='png'?'PNG':'JPEG',10,10,im.width*s,im.height*s);return d.output('blob')}
async function convOne(f,t){const e=ext(f.name),base=f.name.replace(/\.[^.]+$/,''),b=await f.blob.arrayBuffer();let blob;
 if(['xlsx','xls','csv'].includes(e)){const wb=XLSX.read(b,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];
  if(t==='csv')blob=new Blob([XLSX.utils.sheet_to_csv(ws)],{type:'text/csv'});
  else if(t==='json')blob=new Blob([JSON.stringify(XLSX.utils.sheet_to_json(ws),null,2)],{type:'application/json'});
  else if(t==='xlsx')blob=new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})]);
  else blob=textPdf(XLSX.utils.sheet_to_json(ws,{header:1,defval:''}).map(r=>r.join(' | ')).join('\n'))}
 else if(e==='json'){let j;try{j=JSON.parse(new TextDecoder().decode(b))}catch(x){throw new Error(f.name+' is not valid JSON.')}if(!Array.isArray(j))j=[j];const ws=XLSX.utils.json_to_sheet(j);
  blob=t==='csv'?new Blob([XLSX.utils.sheet_to_csv(ws)],{type:'text/csv'}):new Blob([XLSX.write({SheetNames:['Sheet1'],Sheets:{Sheet1:ws}},{type:'array',bookType:'xlsx'})])}
 else if(e==='docx')blob=t==='txt'?new Blob([(await mammoth.extractRawText({arrayBuffer:b})).value]):new Blob([(await mammoth.convertToHtml({arrayBuffer:b})).value],{type:'text/html'});
 else if(e==='pdf')blob=new Blob([await pdfText(b,true)]);
 else if(e==='txt')blob=textPdf(new TextDecoder().decode(b));
 else blob=await imgPdf(f);
 return{name:base+'.'+t,blob}}
function drawRes(){$('#cRes').innerHTML=CR.map((r,i)=>r.err?`<li><span>${esc(r.name)}</span><span style="color:var(--err)">${esc(r.err)}</span></li>`:`<li><span>${esc(r.name)}</span><span class="sm">${fmt(r.blob.size)}</span><button data-a="rdl" data-n="${i}">Download</button><button data-a="rsv" data-n="${i}">Save to Library</button></li>`).join('');
 $('#cZip').disabled=CR.filter(r=>!r.err).length<2;$('#cZip').title=$('#cZip').disabled?'Convert two or more files first':''}
async function doConv(){const fs=sel.map(get);if(!fs.length)throw new Error('Select files first.');CR=[];const t=$('#cT').value;
 for(let i=0;i<fs.length;i++){bar('#cBar',i/fs.length);try{CR.push(await convOne(fs[i],t))}catch(e){CR.push({name:fs[i].name,err:e.message})}}
 bar('#cBar',1);drawRes();toast('Conversion finished')}
/* extract */
function cnt(){const v=$('#eTxt').value;$('#eCnt').textContent=`${(v.trim()?v.trim().split(/\s+/).length:0)} words, ${v.length} characters`}
async function doExt(){const fs=sel.map(get);if(!fs.length)throw new Error('Select files first.');const sep=$('#eSep').checked,o=[];
 for(const f of fs){try{o.push((sep&&fs.length>1?`=== ${f.name} ===\n`:'')+await getText(f,sep))}catch(e){toast(f.name+': '+e.message,1)}}
 $('#eTxt').value=o.join('\n\n');cnt()}
/* sorter */
let S={wb:null,rows:[],hd:[],shown:[],m:null,vals:null};
function fillSorter(pick){const fs=F.filter(f=>['xlsx','xls','csv'].includes(ext(f.name))),cur=$('#sFile').value;
 $('#sFile').innerHTML=fs.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('');
 const want=pick&&sel.find(i=>fs.some(f=>f.id===i));if(want)$('#sFile').value=want;else if(fs.some(f=>f.id===cur))$('#sFile').value=cur;
 if(fs.length&&(pick||!S.wb))sLoad();if(!fs.length){S={wb:null,rows:[],hd:[],shown:[]};drawT()}}
async function sLoad(){const f=get($('#sFile').value);if(!f)return;try{S.wb=XLSX.read(await f.blob.arrayBuffer(),{type:'array'});$('#sSheet').innerHTML=S.wb.SheetNames.map(n=>`<option>${esc(n)}</option>`).join('');sSheet()}catch(e){toast('Could not read '+f.name,1)}}
function sSheet(){const a=XLSX.utils.sheet_to_json(S.wb.Sheets[$('#sSheet').value],{header:1,defval:''});S.hd=(a[0]||[]).map((h,i)=>String(h)||'Column '+(i+1));S.rows=a.slice(1);S.shown=S.rows;S.m=null;S.vals=null;
 $('#sCols').innerHTML=S.hd.map((h,i)=>`<option value="${i}">${esc(h)}</option>`).join('');$('#sTxt').value='';$('#sCnt').textContent='';drawT()}
function drawT(){$('#sInfo').textContent=S.wb?`${S.rows.length} rows, ${S.hd.length} columns`:'Add an Excel or CSV file in the Library first.';
 $('#sH').innerHTML=S.hd.length?'<tr>'+S.hd.map((h,i)=>`<th class="s" data-c="${i}" title="Click to sort">${esc(h)}</th>`).join('')+'</tr>':'';
 $('#sB').innerHTML=S.shown.length?S.shown.slice(0,300).map(r=>'<tr>'+S.hd.map((_,i)=>{const v=r[i]??'',h=S.m&&S.use.includes(i)&&v!==''&&S.m(v);return `<td>${h?'<mark>'+esc(v)+'</mark>':esc(v)}</td>`}).join('')+'</tr>').join(''):`<tr><td class="empty">${S.vals?'No matches.':'Nothing to show yet.'}</td></tr>`}
function matcher(){const kws=$('#sKw').value.split('\n').map(s=>s.trim()).filter(Boolean);if(!kws.length)throw new Error('Enter at least one keyword.');const m=$('#sMode').value,cs=$('#sCase').checked;
 const ts=kws.map(k=>{if(m==='regex'){let r;try{r=new RegExp(k,cs?'':'i')}catch(e){throw new Error('Invalid regex: '+k)}return v=>r.test(v)}
  const kk=cs?k:k.toLowerCase();return v=>{v=cs?v:v.toLowerCase();return m==='exact'?v===kk:m==='starts'?v.startsWith(kk):v.includes(kk)}});return v=>ts.some(t=>t(String(v)))}
function sSearch(){if(!S.rows.length)throw new Error('Load a spreadsheet first.');const t=matcher(),c=[...$('#sCols').selectedOptions].map(o=>+o.value),use=c.length?c:S.hd.map((_,i)=>i),vals=[];
 S.shown=S.rows.filter(r=>{let h=false;use.forEach(i=>{if(r[i]!==''&&t(r[i])){h=true;vals.push(String(r[i]))}});return h});S.m=t;S.use=use;S.vals=vals;drawT();sOut()}
function sOut(){if(!S.vals)return;let v=[...S.vals];if($('#sDup').checked)v=[...new Set(v)];const o=$('#sSort').value;if(o)v.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})*(o==='za'?-1:1));
 const om=$('#sOM').value,sep={nl:'\n',comma:', ',tab:'\t',custom:$('#sCust').value}[$('#sSep').value];S.out=v;
 $('#sTxt').value=om==='table'?[S.hd.join('\t'),...S.shown.map(r=>r.join('\t'))].join('\n'):v.join(om==='col'?'\n':sep);
 $('#sCnt').textContent=`${S.shown.length} matching rows, ${v.length} values in output`}
function sGet(){if(!S.vals)throw new Error('Run a search first.');return $('#sOM').value==='table'?[S.hd,...S.shown]:S.out.map(x=>[x])}
function sXl(csv){const ws=XLSX.utils.aoa_to_sheet(sGet());if(csv)return XLSX.utils.sheet_to_csv(ws);const b=XLSX.utils.book_new();XLSX.utils.book_append_sheet(b,ws,'Results');return XLSX.write(b,{type:'array',bookType:'xlsx'})}
/* events */
document.addEventListener('click',e=>{const t=e.target.closest('button,th.s');if(!t)return;
 if(t.dataset.t)return go(t.dataset.t);
 if(t.dataset.go){if(!sel.length&&t.dataset.go!=='sort')toast('Tick at least one file first.',1);renderSel();return go(t.dataset.go)}
 const a=t.dataset.a,f=get(t.dataset.id),n=+t.dataset.n;
 if(t.matches('th.s')){const c=+t.dataset.c;S.asc=S.sc===c?!S.asc:true;S.sc=c;S.shown=[...S.shown].sort((x,y)=>String(x[c]).localeCompare(String(y[c]),undefined,{numeric:true})*(S.asc?1:-1));drawT()}
 else if(a==='up'&&n>0){[sel[n-1],sel[n]]=[sel[n],sel[n-1]];renderSel()}
 else if(a==='dn'&&n<sel.length-1){[sel[n+1],sel[n]]=[sel[n],sel[n+1]];renderSel()}
 else if(a==='rm'){sel.splice(n,1);renderSel();renderLib()}
 else if(a==='dl')dl(f.blob,f.name);
 else if(a==='del'){if(confirm('Delete '+f.name+'?'))run(t,async()=>{await tx('readwrite',s=>s.delete(f.id));F=F.filter(x=>x!==f);renderAll()})}
 else if(a==='pv')run(t,async()=>{const d=$('#dBody'),e2=ext(f.name);d.innerHTML='<h2>'+esc(f.name)+'</h2>';
  if(['png','jpg','jpeg','gif','webp'].includes(e2)){const u=await new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f.blob)});d.innerHTML+=`<img src="${u}" alt="">`}
  else{let x;try{x=(await getText(f,false)).slice(0,3000)}catch(er){x=er.message}d.innerHTML+=`<pre>${esc(x)}</pre>`}$('#dlg').showModal()});
 else if(a==='rdl')dl(CR[n].blob,CR[n].name);
 else if(a==='rsv')run(t,async()=>{await add(CR[n].blob,CR[n].name);renderAll();toast('Saved to Library')});
});
document.addEventListener('change',e=>{const c=e.target;if(c.dataset.id&&c.type==='checkbox'){sel=c.checked?[...sel,c.dataset.id]:sel.filter(i=>i!==c.dataset.id);renderSel()}});
$('#dClose').onclick=()=>$('#dlg').close();
$('#browse').onclick=()=>$('#fi').click();$('#fi').onchange=e=>{upload([...e.target.files]);e.target.value=''};
const dz=$('#drop');['dragenter','dragover'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add('over')}));['dragleave','drop'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.remove('over')}));dz.addEventListener('drop',e=>upload([...e.dataTransfer.files]));
$('#clr').onclick=()=>{if(confirm('Delete all saved files from this browser?'))run($('#clr'),async()=>{await tx('readwrite',s=>s.clear());F=[];sel=[];M=null;CR=[];renderAll();drawRes();toast('Cache cleared')})};
$('#theme').onclick=()=>{const d=document.documentElement,dark=d.dataset.theme?d.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;d.dataset.theme=dark?'light':'dark'};
$('#mGo').onclick=e=>run(e.target,doMerge);$('#mDl').onclick=()=>M&&dl(M.blob,M.name);$('#mSave').onclick=e=>run(e.target,async()=>{await add(M.blob,M.name);renderAll();toast('Saved to Library')});
$('#cGo').onclick=e=>run(e.target,doConv);
$('#cZip').onclick=e=>run(e.target,async()=>{const z=new JSZip();CR.filter(r=>!r.err).forEach(r=>z.file(r.name,r.blob));dl(await z.generateAsync({type:'blob'}),'converted.zip')});
$('#eGo').onclick=e=>run(e.target,doExt);$('#eTxt').oninput=cnt;
$('#eCopy').onclick=()=>navigator.clipboard.writeText($('#eTxt').value).then(()=>toast('Copied'),()=>toast('Copy blocked by the browser. Select the text and copy manually.',1));
$('#eDl').onclick=()=>$('#eTxt').value?dl(new Blob([$('#eTxt').value],{type:'text/plain'}),'extracted.txt'):toast('Nothing to download yet.',1);
$('#eClr').onclick=()=>{$('#eTxt').value='';cnt()};
$('#sFile').onchange=sLoad;$('#sSheet').onchange=sSheet;
$('#sGo').onclick=e=>run(e.target,async()=>sSearch());
$('#sReset').onclick=()=>{$('#sKw').value='';[...$('#sCols').options].forEach(o=>o.selected=false);if(S.wb)sSheet()};
['sOM','sSep','sDup','sSort'].forEach(i=>$('#'+i).onchange=sOut);$('#sCust').oninput=()=>{$('#sSep').value='custom';sOut()};
$('#sCopy').onclick=()=>$('#sTxt').value?navigator.clipboard.writeText($('#sTxt').value).then(()=>toast('Copied'),()=>toast('Copy blocked by the browser. Select the text and copy manually.',1)):toast('Run a search first.',1);
$('#sX').onclick=e=>run(e.target,async()=>dl(new Blob([sXl(false)]),'results.xlsx'));
$('#sC').onclick=e=>run(e.target,async()=>dl(new Blob([sXl(true)],{type:'text/csv'}),'results.csv'));
$('#sT').onclick=()=>$('#sTxt').value?dl(new Blob([$('#sTxt').value],{type:'text/plain'}),'results.txt'):toast('Run a search first.',1);
(async()=>{renderAll();db=await openDB();if(!db){toast('Browser storage is unavailable. Files will be lost on refresh.',1);return}
 F=(await tx('readonly',s=>s.getAll()))||[];F.sort((a,b)=>a.time-b.time);renderAll()})();
</script>
</body>
</html>
