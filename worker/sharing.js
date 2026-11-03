const html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const deny=()=>new Response('分享链接不可用、已到期，或你不是指定接收者。',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
export async function tokenHash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function createShare(bucket,key,note,identity,settings){
  const recipient=String(settings.recipient||'').trim().toLowerCase();
  const days=Number(settings.days??7),scope=settings.scope||'summary';
  if(recipient.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(recipient)||!Number.isInteger(days)||days<1||days>30||!['summary','full'].includes(scope))return {error:'请填写有效的接收者邮箱、1 至 30 天有效期，并选择分享范围。',status:400};
  if(scope==='summary'&&!note.summary)return {error:'请先生成摘要，或选择分享正文与摘要。',status:409};
  const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const hash=await tokenHash(token),expires=new Date(Date.now()+days*86400000).toISOString();
  const link={key,hash,recipient,ownerEmail:identity.email.toLowerCase(),scope,expires};
  const previous=note.share?.hash;
  await bucket.put('shares/'+hash,JSON.stringify(link));
  note.share={hash,recipient,scope,expires};
  await bucket.put(key,JSON.stringify(note));
  if(previous)await bucket.delete('shares/'+previous);
  return {token,note};
}
export async function revokeShare(bucket,key,note){if(note.share?.hash)await bucket.delete('shares/'+note.share.hash);delete note.share;await bucket.put(key,JSON.stringify(note));return note}
export async function readShare(bucket,token,identity){
  if(!identity)return new Response('请先通过网站登录，再打开分享链接。',{status:401,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  if(!bucket||!/^\w{64}$/.test(token))return deny();
  const hash=await tokenHash(token),obj=await bucket.get('shares/'+hash);if(!obj)return deny();
  const link=await obj.json();
  if(!link.expires||Date.parse(link.expires)<=Date.now()||![link.recipient,link.ownerEmail].includes(identity.email.toLowerCase()))return deny();
  const file=await bucket.get(link.key);if(!file)return deny();const note=await file.json();
  if(note.share?.hash!==hash)return deny();
  const content=link.scope==='full'?note.text+'\n\n摘要\n'+(note.summary||'尚未生成摘要'):note.summary;
  if(!content)return deny();
  return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>只读分享讲义</title><style>body{max-width:800px;margin:48px auto;padding:24px;font:16px/1.85 system-ui;color:#173e35;background:#f8f9f5}article{background:white;padding:30px;border:1px solid #e2e7df;border-radius:12px}pre{white-space:pre-wrap;font:inherit}small{color:#667568}</style><article><small>Folio · 只读分享</small><h1>'+html(note.title)+'</h1><p>分享范围：'+(link.scope==='full'?'正文与摘要':'仅摘要')+' · 到期时间：'+html(link.expires)+'</p><pre>'+html(content)+'</pre><small>私人批注和原始文件不包含在本次分享中。摘要请结合原文核对。</small></article></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"}});
}
