import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getIdentity} from './worker/auth.js';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test'};
const env={ACCESS_ISSUER:'https://test-team.cloudflareaccess.com',ACCESS_AUD:'test-audience'};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
export async function token(sub='alice',changes={}){const input=enc({alg:'RS256',kid:'test'})+'.'+enc({iss:env.ACCESS_ISSUER,aud:[env.ACCESS_AUD],sub,email:sub+'@example.test',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300,...changes});const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input));return input+'.'+Buffer.from(signature).toString('base64url')}
export const mockCerts=async()=>Response.json({keys:[jwk]});
export {env};
test('valid signed identity is accepted',async()=>{assert.equal((await getIdentity(new Request('https://example.test',{headers:{'Cf-Access-Jwt-Assertion':await token()}}),env,mockCerts)).id,'alice')});
test('missing configuration and spoofed Sites headers are rejected',async()=>{const request=new Request('https://example.test',{headers:{'oai-authenticated-user-id':'alice'}});assert.equal(await getIdentity(request,env,mockCerts),null);assert.equal(await getIdentity(request,{}),null)});
test('expired token, wrong audience, and forged signature are rejected',async()=>{for(const changes of [{exp:1},{aud:['other']}])assert.equal(await getIdentity(new Request('https://example.test',{headers:{'Cf-Access-Jwt-Assertion':await token('alice',changes)}}),env,mockCerts),null);const valid=await token();assert.equal(await getIdentity(new Request('https://example.test',{headers:{'Cf-Access-Jwt-Assertion':valid.slice(0,valid.lastIndexOf('.')+1)+'AAAA'}}),env,mockCerts),null)});
