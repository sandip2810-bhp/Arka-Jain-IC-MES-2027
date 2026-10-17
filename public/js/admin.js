(async()=>{
const SEL='.hero h1,.hero p,.lead,.conf h3,.conf li,.conf p,.conf td,.conf .sub,.chips span,.adv summary,.adv li,.top span,footer span,a[data-link]';
const link=document.getElementById('adminlink');
let ok=false;
try{ok=(await fetch('/api/me',{credentials:'same-origin'})).ok}catch(e){}
if(!ok){if(link)link.onclick=e=>{e.preventDefault();login()};if(location.hash==='#admin')login();return}
if(link)link.hidden=true;

function login(){
 const w=document.createElement('div');w.id='adminlogin';
 const f=document.createElement('form');
 const h=document.createElement('strong');h.textContent='Admin login';
 const i=document.createElement('input');i.type='password';i.placeholder='Password';i.autocomplete='current-password';
 const m=document.createElement('span');
 const b=document.createElement('button');b.className='pri';b.textContent='Log in';
 const c=document.createElement('button');c.type='button';c.textContent='Cancel';c.onclick=()=>w.remove();
 f.append(h,i,m,b,c);w.appendChild(f);document.body.appendChild(w);i.focus();
 f.onsubmit=async e=>{e.preventDefault();m.textContent='';
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:i.value})});
  if(r.ok)location.reload();else m.textContent=r.status===429?'Too many attempts. Try again later.':'Wrong password.'};
}

const bar=document.createElement('div');bar.id='adminbar';
const msg=document.createElement('span');msg.textContent='Admin mode';
const mk=(t,c)=>{const b=document.createElement('button');b.textContent=t;if(c)b.className=c;return b};
const b1=mk('Edit page'),b2=mk('Save','pri'),b3=mk('Cancel'),b4=mk('Log out');
b2.hidden=b3.hidden=true;
bar.append(msg,b1,b2,b3,b4);document.body.appendChild(bar);

function ctl(txt,fn,cls){const b=document.createElement('button');b.type='button';b.className='ctl '+(cls||'');b.textContent=txt;b.contentEditable='false';b.onclick=e=>{e.preventDefault();e.stopPropagation();fn(b)};return b}
const delBtn=()=>ctl('Delete',b=>b.parentElement.remove());
function pick(acc,cb){const i=document.createElement('input');i.type='file';i.accept=acc;
 i.onchange=async()=>{const f=i.files[0];if(!f)return;const fd=new FormData();fd.append('file',f);
  try{const r=await fetch('/api/upload',{method:'POST',body:fd});if(!r.ok)throw new Error('Upload failed ('+r.status+')');cb((await r.json()).url)}catch(e){alert(e.message)}};i.click()}

b1.onclick=()=>{
 document.body.classList.add('editing');
 document.querySelectorAll(SEL).forEach(e=>e.contentEditable='true');
 document.querySelectorAll('.conf li,.adv li').forEach(li=>li.appendChild(delBtn()));
 document.querySelectorAll('.conf ul,.adv ol').forEach(l=>l.after(ctl('+ Add item',()=>{const n=document.createElement('li');n.contentEditable='true';n.textContent='New item';n.appendChild(delBtn());l.appendChild(n)},'add')));
 document.querySelectorAll('.conf table').forEach(tb=>tb.after(ctl('+ Add row',()=>{const r=tb.rows[tb.rows.length-1].cloneNode(true);r.querySelectorAll('.ctl').forEach(x=>x.remove());r.cells[0].textContent='New label';r.cells[1].textContent='Details';r.cells[1].className='';r.querySelectorAll('td').forEach(x=>x.contentEditable='true');tb.tBodies[0].appendChild(r)},'add')));
 document.querySelectorAll('a[data-link]').forEach(a=>{
  a.addEventListener('click',e=>{if(document.body.classList.contains('editing'))e.preventDefault()});
  a.after(ctl('Upload file',()=>pick('.pdf,.doc,.docx,image/*',u=>a.setAttribute('href',u))));
  a.after(ctl('Set link',()=>{const u=prompt('Full link (https://... or mailto:name@site.com)',a.getAttribute('href'));if(u)a.setAttribute('href',u)}));
 });
 document.querySelectorAll('img[data-up]').forEach(im=>im.after(ctl('Change image',()=>pick('image/*',u=>{im.src=u}))));
 b1.hidden=true;b2.hidden=b3.hidden=false;msg.textContent='Editing: click any text to change it';
};
b3.onclick=()=>location.reload();
b4.onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.reload()};
b2.onclick=async()=>{b2.disabled=true;msg.textContent='Saving...';
 try{
  const c=document.documentElement.cloneNode(true);
  c.querySelectorAll('.ctl,#adminbar,#adminlogin').forEach(e=>e.remove());
  const al=c.querySelector('#adminlink');if(al)al.removeAttribute('hidden');
  c.querySelectorAll('[contenteditable]').forEach(e=>e.removeAttribute('contenteditable'));
  c.querySelector('body').classList.remove('editing');
  c.querySelectorAll('.ph').forEach(e=>{if(!/to be added|^Name, |Sample/i.test(e.textContent))e.classList.remove('ph')});
  const r=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html:'<!DOCTYPE html>\n'+c.outerHTML})});
  if(!r.ok)throw new Error(r.status===401?'Session expired. Log in again.':'Save failed ('+r.status+')');
  location.reload();
 }catch(e){b2.disabled=false;msg.textContent=e.message}};
})();
