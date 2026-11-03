const MAX_BYTES=20*1024*1024;
export async function storeOriginal(request,bucket,key,format) {
  const type={PDF:'application/pdf',DOCX:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',TXT:'text/plain; charset=utf-8'}[format];
  if(!type)return new Response('Unsupported format',{status:400});
  if(Number(request.headers.get('Content-Length'))>MAX_BYTES)return new Response('Maximum file size is 20 MB',{status:413});
  if(!request.body)return new Response('An original file is required',{status:400});
  const reader=request.body.getReader();let total=0;const chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES){await reader.cancel();return new Response('Maximum file size is 20 MB',{status:413})}chunks.push(value)}
  if(!total)return new Response('Empty files are not supported',{status:400});
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
  if(format==='PDF'&&new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return new Response('Invalid PDF file',{status:400});
  if(format==='DOCX'&&(bytes[0]!==0x50||bytes[1]!==0x4b))return new Response('Invalid DOCX container',{status:400});
  await bucket.put(key,bytes,{httpMetadata:{contentType:type}});
  return Response.json({ok:true,size:total},{headers:{'Cache-Control':'no-store'}});
}
