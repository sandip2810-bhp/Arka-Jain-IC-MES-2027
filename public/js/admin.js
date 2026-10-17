(async()=>{
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
function pick(acc,cb){const i=document.createElement('input');i.type='file';i.accept=acc;
 i.onchange=async()=>{const f=i.files[0];if(!f)return;const fd=new FormData();fd.append('file',f);
  try{const r=await fetch('/api/upload',{method:'POST',body:fd});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Upload failed ('+r.status+')');cb(j.url)}catch(e){alert(e.message)}};i.click()}

// Makes everything inside root editable: text, delete buttons, photo buttons, add buttons, links
function arm(root){
 const all=[...root.querySelectorAll('*')];if(root.nodeType===1)all.unshift(root);
 all.forEach(e=>{
  if(e.matches('[data-e],a[data-link]'))e.contentEditable='true';
  if(e.hasAttribute('data-del'))(e.tagName==='TR'?e.lastElementChild:e).appendChild(ctl('Delete',()=>e.remove(),'del'));
  if(e.matches('img[data-up]'))e.after(ctl('Change image',()=>pick('image/*',u=>{e.src=u})));
  if(e.matches('a[data-link]')){
   e.addEventListener('click',ev=>{if(document.body.classList.contains('editing'))ev.preventDefault()});
   e.after(ctl('Upload file',()=>pick('.pdf,.doc,.docx,image/*',u=>e.setAttribute('href',u))));
   e.after(ctl('Set link',()=>{
    let u=prompt('Paste the form link (Google Form, Microsoft Form, Typeform, etc.)',e.getAttribute('href')||'');
    if(u===null)return;u=u.trim();if(!u)return;
    if(!/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(u))u='https://'+u;
    e.setAttribute('href',u);
    if(/^https?:\/\//i.test(u)){e.setAttribute('target','_blank');e.setAttribute('rel','noopener noreferrer')}
    else{e.removeAttribute('target');e.removeAttribute('rel')}
   }));
  }
  if(e.hasAttribute('data-add'))e.after(ctl('+ Add',()=>{
   const last=e.tagName==='TABLE'?e.tBodies[0].lastElementChild:e.lastElementChild;if(!last)return;
   const n=last.cloneNode(true);n.querySelectorAll('.ctl').forEach(x=>x.remove());
   n.querySelectorAll('img[data-up]').forEach(i=>i.setAttribute('src','assets/person.svg'));
   (n.hasAttribute('data-e')?[n]:[...n.querySelectorAll('[data-e]')]).forEach((x,i)=>{x.textContent=i?'Details':'New item';x.classList.remove('ph')});
   (e.tagName==='TABLE'?e.tBodies[0]:e).appendChild(n);arm(n);
  },'add'));
 });
}

b1.onclick=()=>{
 document.body.classList.add('editing');
 document.querySelectorAll('details.adv').forEach(d=>d.open=true);
 arm(document.querySelector('main'));arm(document.querySelector('footer'));arm(document.querySelector('.credit'));
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
  c.querySelectorAll('details.adv').forEach(d=>d.removeAttribute('open'));
  c.querySelector('body').classList.remove('editing');
  c.querySelectorAll('.ph').forEach(e=>{if(!/to be added|^New item|^Details/i.test(e.textContent))e.classList.remove('ph')});
  const r=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html:'<!DOCTYPE html>\n'+c.outerHTML})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||(r.status===401?'Session expired. Log in again.':'Save failed ('+r.status+')'));
  location.reload();
 }catch(e){b2.disabled=false;msg.textContent=e.message}};
})();