const CTM={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};

async function toJpeg(file){
  let src,w,h;
  try{src=await createImageBitmap(file);w=src.width;h=src.height}
  catch(e){
    src=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Could not read that photo.'));i.src=URL.createObjectURL(file)});
    w=src.naturalWidth;h=src.naturalHeight;
  }
  const sc=Math.min(1,1600/Math.max(w,h)),cw=Math.round(w*sc),ch=Math.round(h*sc);
  const c=document.createElement('canvas');c.width=cw;c.height=ch;
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(src,0,0,cw,ch);
  if(src.close)src.close();
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));
  if(!blob)throw new Error('Could not process that photo.');
  c.width=c.height=0;
  return {w:cw,h:ch,bytes:new Uint8Array(await blob.arrayBuffer())};
}

function pdfFromJpegs(pages){
  const te=new TextEncoder(),parts=[],offs=[];let len=0;
  const add=b=>{if(typeof b==='string')b=te.encode(b);parts.push(b);len+=b.length};
  const N=pages.length,total=2+3*N;
  add('%PDF-1.4\n');
  offs[1]=len;add('1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n');
  offs[2]=len;add(`2 0 obj\n<</Type/Pages/Count ${N}/Kids[${pages.map((_,i)=>`${3+3*i} 0 R`).join(' ')}]>>\nendobj\n`);
  pages.forEach((p,i)=>{
    const pid=3+3*i,cid=pid+1,iid=pid+2;
    const s=Math.min(595/p.w,842/p.h),dw=(p.w*s).toFixed(2),dh=(p.h*s).toFixed(2);
    const x=((595-p.w*s)/2).toFixed(2),y=((842-p.h*s)/2).toFixed(2);
    const content=`q ${dw} 0 0 ${dh} ${x} ${y} cm /Im0 Do Q`;
    offs[pid]=len;add(`${pid} 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</XObject<</Im0 ${iid} 0 R>>>>/Contents ${cid} 0 R>>\nendobj\n`);
    offs[cid]=len;add(`${cid} 0 obj\n<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`);
    offs[iid]=len;add(`${iid} 0 obj\n<</Type/XObject/Subtype/Image/Width ${p.w}/Height ${p.h}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${p.bytes.length}>>\nstream\n`);
    add(p.bytes);add('\nendstream\nendobj\n');
  });
  const xr=len;
  let x='xref\n0 '+(total+1)+'\n0000000000 65535 f \n';
  for(let i=1;i<=total;i++)x+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  add(x+`trailer\n<</Size ${total+1}/Root 1 0 R>>\nstartxref\n${xr}\n%%EOF`);
  return new Blob(parts,{type:'application/pdf'});
}

function initCv(startId){
  let cvId=startId;
  const status=$('#cvs'),m=$('#cm'),dl=$('#cvd'),pick=$('#cvpick');

  if(sessionStorage.getItem('gm_picker')){
    sessionStorage.removeItem('gm_picker');
    msg(m,'Your phone refreshed the page while choosing the file. Please tap the CV button and try again. Tip: close other apps first.',false);
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>sessionStorage.removeItem('gm_picker'),2500)});

  if(!$('#cv-sheet')){
    const st=document.createElement('style');
    st.textContent='.opt{background:#fff;border:0;border-radius:16px;padding:16px 6px;font:inherit;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.08)}.opt span{font-size:26px}.fi{position:absolute;opacity:0;width:0;height:0;pointer-events:none}';
    document.head.appendChild(st);
    const w=document.createElement('div');
    w.innerHTML=`<div id="cv-bg" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:50"></div>
    <div id="cv-sheet" style="display:none;position:fixed;left:0;right:0;bottom:0;background:#f7f7f5;border-radius:22px 22px 0 0;padding:16px 16px 26px;z-index:51;max-width:560px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:18px">Add your CV</b><button id="cv-x" class="btn sm out">Close</button></div>
      <p class="meta" style="margin-bottom:14px">Photos are combined into one PDF automatically.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <button class="opt" data-k="cam"><span>&#128247;</span>Camera</button>
        <button class="opt" data-k="pho"><span>&#128444;&#65039;</span>Photos</button>
        <button class="opt" data-k="doc"><span>&#128196;</span>Files</button>
      </div></div>
    <input class="fi" type="file" id="f-cam" accept="image/*" capture="environment">
    <input class="fi" type="file" id="f-pho" accept="image/*" multiple>
    <input class="fi" type="file" id="f-doc" accept=".pdf,.doc,.docx,application/pdf">`;
    while(w.firstChild)document.body.appendChild(w.firstChild);
  }
  const bg=$('#cv-bg'),sheet=$('#cv-sheet');
  const open=()=>{bg.style.display='block';sheet.style.display='block'};
  const close=()=>{bg.style.display='none';sheet.style.display='none'};
  pick.onclick=open;bg.onclick=close;$('#cv-x').onclick=close;
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    sessionStorage.setItem('gm_picker','1');close();$('#f-'+b.dataset.k).click();
  });

  async function handle(files,kind){
    sessionStorage.removeItem('gm_picker');
    if(!files.length)return;
    try{
      let blob,type;
      if(kind==='doc'){
        const f=files[0],ext=f.name.split('.').pop().toLowerCase();
        type=CTM[ext];
        if(!type)throw new Error('Please choose a PDF, DOC or DOCX file.');
        if(f.size>5*1024*1024)throw new Error('File is too large (max 5 MB).');
        blob=f;
      }else{
        status.textContent='Preparing your CV photo'+(files.length>1?'s':'')+'...';
        const pages=[];
        for(const f of [...files].slice(0,6))pages.push(await toJpeg(f));
        blob=pdfFromJpegs(pages);type='application/pdf';
      }
      status.textContent='Uploading...';
      const d=await api('/api/profile/cv',{method:'PUT',body:blob,raw:true,headers:{'Content-Type':type}});
      cvId=d.file_id;dl.style.display='';pick.textContent='Replace CV';
      status.textContent='CV uploaded.';msg(m,'CV uploaded successfully.',true);
    }catch(e){
      status.textContent=cvId?'CV uploaded.':'No CV uploaded yet.';msg(m,e.message,false);
    }
  }
  [['cam','img'],['pho','img'],['doc','doc']].forEach(([k,kind])=>{
    $('#f-'+k).onchange=e=>{const fs=[...e.target.files];e.target.value='';handle(fs,kind)};
  });

  dl.onclick=async()=>{
    const r=await fetch(API+'/api/files/'+cvId,{headers:{Authorization:'Bearer '+tok()}});
    if(!r.ok)return msg(m,'Could not download your CV.',false);
    const ct=r.headers.get('Content-Type')||'';
    const ext=ct.includes('pdf')?'.pdf':ct.includes('wordprocessingml')?'.docx':'.doc';
    const a=document.createElement('a');a.href=URL.createObjectURL(await r.blob());a.download='my-cv'+ext;a.click();
  };
}
