const API='https://goldenmiles-api.kerosoftz522.workers.dev';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('en-US');
const sal=j=>j.salary_min?`${esc(j.currency)} ${fmt(j.salary_min)}${j.salary_max?' - '+fmt(j.salary_max):'+'}`:'Salary negotiable';
const tok=()=>localStorage.getItem('gm_token');
const user=()=>{try{return JSON.parse(localStorage.getItem('gm_user')||'null')}catch(e){return null}};
const setAuth=(t,u)=>{localStorage.setItem('gm_token',t);localStorage.setItem('gm_user',JSON.stringify(u))};
function logout(){localStorage.removeItem('gm_token');localStorage.removeItem('gm_user');location.href='index.html'}
const safeNext=n=>/^[\w.\-]+(\?[\w=&%.\-]*)?$/.test(n||'')?n:'dashboard.html';
const msg=(el,t,ok)=>{el.className='msg '+(ok?'ok':'bad');el.textContent=t;el.style.display='block'};

async function api(path,opts={}){
  const h={...(opts.headers||{})};
  let body=opts.body;
  if(body!==undefined&&!opts.raw){h['Content-Type']='application/json';body=JSON.stringify(body)}
  if(tok())h.Authorization='Bearer '+tok();
  const r=await fetch(API+path,{method:opts.method||'GET',headers:h,body});
  let d=null;try{d=await r.json()}catch(e){}
  if(r.status===401&&tok()){
    localStorage.removeItem('gm_token');localStorage.removeItem('gm_user');
    if(!opts.noRedirect)location.href='login.html';
  }
  if(!r.ok)throw new Error((d&&d.error)||'Request failed');
  return d;
}

function hdr(){
  const u=user();
  document.querySelector('header').innerHTML=`<div class="wrap"><a class="logo" href="index.html">WinZ <b>GoldenMiles</b></a><nav><a href="index.html#jobs">Jobs</a>${u?'<a href="dashboard.html">Dashboard</a><button onclick="logout()">Logout</button>':'<a href="login.html">Login</a>'}</nav></div>`;
}
