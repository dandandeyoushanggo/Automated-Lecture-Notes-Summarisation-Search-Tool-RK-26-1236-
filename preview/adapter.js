/* Device-local UI preview. Cloud authentication and sharing are intentionally unavailable. */
(() => {
  const open = new Promise((resolve,reject)=>{const r=indexedDB.open('folio-preview-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('notes',{keyPath:'id'});r.result.createObjectStore('files')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  async function dbop(store,mode,action){const db=await open;return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode),r=action(tx.objectStore(store));tx.oncomplete=()=>resolve(r?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
  const all=()=>dbop('notes','readonly',s=>s.getAll());
  const put=n=>dbop('notes','readwrite',s=>s.put(n));
  const originals=window.fetch.bind(window);
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  window.fetch=async(url,options={})=>{
    const path=String(url);if(!path.startsWith('/api/'))return originals(url,options);
    try{
      const method=options.method||'GET',parts=path.split('/'),id=parts[3];
      if(path==='/api/notes'&&method==='GET')return reply({notes:await all(),user:'Local preview'});
      if(path==='/api/notes'&&method==='POST'){const b=JSON.parse(options.body),n={...b,id:crypto.randomUUID(),summary:'',annotation:'',updated:new Date().toISOString()};await put(n);return reply(n)}
      const note=await dbop('notes','readonly',s=>s.get(id));if(!note)return reply({error:'Note not found'},404);
      if(parts[4]==='original'){
        if(method==='PUT'){await dbop('files','readwrite',s=>s.put(options.body,id));return reply({ok:true})}
        const file=await dbop('files','readonly',s=>s.get(id));return file?new Response(file):reply({error:'This sample has no original file.'},404);
      }
      if(method==='DELETE'){await dbop('notes','readwrite',s=>s.delete(id));await dbop('files','readwrite',s=>s.delete(id));return reply({ok:true})}
      if(method==='PUT'){const n={...note,...JSON.parse(options.body),id,updated:new Date().toISOString()};await put(n);return reply(n)}
      return reply({error:'Online sharing will be connected with the backend. This preview stores notes on this device only.'},503);
    }catch{return reply({error:'Unable to save on this device. Check browser storage permissions.'},500)}
  };
  window.downloadPreviewOriginal=async(id,title,format)=>{const file=await dbop('files','readonly',s=>s.get(id));if(!file){alert('This sample has no original file. Upload a lecture to try original downloads.');return}const a=document.createElement('a'),u=URL.createObjectURL(file);a.href=u;a.download=title+'.'+format.toLowerCase();a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
  window.folioReady=(async()=>{if((await all()).length||localStorage.getItem('folio-seeded'))return;
    const samples=[
      {title:'Decision trees & information gain',category:'Machine Learning',tags:['week 4','classification'],format:'SAMPLE',text:'A decision tree is a supervised learning method for classification and regression. Internal nodes test features, branches represent outcomes, and leaves give predictions.\n\nEntropy measures uncertainty. A group containing only one class has zero entropy. A balanced mixture has higher entropy.\n\nInformation gain is the reduction in entropy after a split. A useful split produces groups that are more homogeneous than the parent group.\n\nDeep trees can overfit training examples. Limiting depth, requiring more samples at a leaf, and pruning can improve generalisation.\n\nA random forest combines trees trained on bootstrap samples and considers random feature subsets at each split. Combining predictions can reduce variance.',summary:'• Decision trees predict using feature tests and branches.\n\n• Entropy measures uncertainty; pure groups have zero entropy.\n\n• Information gain measures how much a split reduces uncertainty.\n\n• Restricting tree depth can reduce overfitting.',annotation:''},
      {title:'Analogue to digital conversion',category:'Embedded Systems',tags:['week 5','ADC','revision'],format:'SAMPLE',text:'An analogue to digital converter maps a continuous input voltage to a discrete numerical value. Resolution determines the number of possible output codes.\n\nA ten-bit ADC provides 1024 codes. With a 5 volt reference, one quantisation step is approximately 4.88 millivolts.\n\nAn LM35 temperature sensor produces approximately 10 millivolts per degree Celsius. The converted voltage can be used to estimate temperature.\n\nReference voltage accuracy, electrical noise and sensor calibration affect measurement accuracy. A stable reference and repeated measurements can improve consistency.',summary:'',annotation:''},
      {title:'Planning a reliable software project',category:'Project Development',tags:['planning','requirements'],format:'SAMPLE',text:'A software project should begin with a clear problem statement, a bounded scope and testable requirements. Each feature needs an observable acceptance condition.\n\nAn iterative approach delivers small working increments. Reviewing each increment helps identify risks before they become expensive.\n\nFunctional testing checks behaviour, while permission testing checks who may perform each action. A working interface alone does not prove that private data is protected.\n\nEvaluation should distinguish measured results from proposed targets. Record test inputs, software versions, limitations and reproducible steps.',summary:'',annotation:''}
    ];for(let i=0;i<samples.length;i++)await put({...samples[i],id:crypto.randomUUID(),updated:new Date(Date.now()-i*86400000).toISOString()});localStorage.setItem('folio-seeded','1')})();
})();
