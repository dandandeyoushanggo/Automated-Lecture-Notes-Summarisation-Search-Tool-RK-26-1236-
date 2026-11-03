// Verify Cloudflare Access assertions; never trust a client-supplied user ID.
let cached = null;
const decode = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function getIdentity(request, env, fetchKeys=fetch) {
  const issuer=env.ACCESS_ISSUER, audience=env.ACCESS_AUD;
  if(!issuer || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !audience) return null;
  const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!jwt || jwt.length>20000)return null;
  try {
    const parts=jwt.split('.');if(parts.length!==3)return null;
    const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const payload=JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const now=Date.now()/1000;
    if(header.alg!=='RS256'||!header.kid||payload.iss!==issuer||typeof payload.exp!=='number'||payload.exp<=now||typeof payload.iat!=='number'||payload.iat>now+30||!payload.sub||typeof payload.sub!=='string')return null;
    if(payload.nbf!==undefined&&(typeof payload.nbf!=='number'||payload.nbf>now))return null;
    const audiences=Array.isArray(payload.aud)?payload.aud:[payload.aud];if(!audiences.includes(audience))return null;
    if(!cached||cached.issuer!==issuer||cached.until<Date.now()||!cached.keys.some(k=>k.kid===header.kid)) {
      const response=await fetchKeys(issuer+'/cdn-cgi/access/certs');if(!response.ok)return null;
      const body=await response.json();if(!Array.isArray(body.keys))return null;
      cached={issuer,keys:body.keys,until:Date.now()+300000};
    }
    const jwk=cached.keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))return null;
    return {id:payload.sub,email:typeof payload.email==='string'?payload.email:'Student'};
  }catch{return null}
}
