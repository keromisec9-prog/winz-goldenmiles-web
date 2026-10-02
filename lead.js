(function(){
var API='https://goldenmiles-api.kerosoftz522.workers.dev';
var f=document.getElementById('lead'),m=document.getElementById('lead-msg');
if(!f)return;
f.addEventListener('submit',async function(e){
  e.preventDefault();
  var d={};new FormData(f).forEach(function(v,k){d[k]=v});
  if(d.website)return;delete d.website;
  d.positions=parseInt(d.positions,10)||1;
  d.notes='[page: '+(f.dataset.page||'')+'] '+(d.notes||'');
  try{
    var r=await fetch(API+'/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
    var j=await r.json();
    if(r.ok){f.reset();m.className='msg ok';m.textContent='Thank you! Our recruitment team will contact you shortly.'}
    else{m.className='msg bad';m.textContent=j.error||'Something went wrong. Please try again.'}
  }catch(x){m.className='msg bad';m.textContent='Network error. Please try again.'}
  m.style.display='block';
});
})();
