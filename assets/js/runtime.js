/* Fueling Curiosity v2 — device-local progress and phase-owned time. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FC = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const VERSION = '2.0.0-rc.2';
  const UNITS = [
    ['extraction','Extraction','1','Start the flow','Tap to collect crude oil.'],
    ['desalter','Desalting','desalter','Protect the equipment','Remove salt and water, keep the oil.'],
    ['distillation','Distillation','2','Choose a pathway','Explore how crude separates into fractions.'],
    ['pump-swap','Pump swap','pump-swap','Keep fuel moving','Bring the spare pump online in sequence.','jetfuel'],
    ['hydrotreating','Hydrotreating','3','Remove sulfur','Tap sulfur atoms to clean the stream.','lpg'],
    ['alky','Alkylation','alky','Build bigger molecules','Make alkylate and move ASO to regeneration.'],
    ['reformer','Reforming','reformer','Reshape the molecules','Balance heat and produce hydrogen.'],
    ['vac','Vacuum tower','vac','Lower the pressure','Help heavy oil boil at a lower temperature.'],
    ['coker','Coking','coker','Make more from the heavy end','Use water jets to clear the coke drum.'],
    ['fcc','Catalytic cracking','fcc','Split and regenerate','Crack feed and recycle spent catalyst.'],
    ['pipe-xray','Pipe inspection','pipe-xray','Find the thin spots','Scan, mark, and clamp the pipe.','diesel'],
    ['gasoline','Gasoline blending','4','Meet the specification','Balance octane, vapor pressure, and cost.','gasoline'],
    ['jetfuel','Jet fuel inspection','4','Check before shipping','Inspect each batch certificate.','jetfuel'],
    ['ulsd','Diesel additives','4','Get the dose right','Use tiny additive doses to treat diesel.','diesel'],
    ['logistics','Delivery','5','Connect to everyday life','Choose how the finished fuel travels.','gasoline'],
    ['sru','Sulfur recovery','sru','Recover a useful resource','Balance air and liquid sulfur level.']
  ].map(([id,label,phase,objective,hint,product])=>({id,label,phase,objective,hint,product}));
  const UNIT_IDS = new Set(UNITS.map(u=>u.id));
  const PHASES = new Set(['0','1','desalter','2','3','alky','reformer','vac','coker','coker-frac','fcc','4','5','transport','finale','pump-swap','pipe-xray','sru']);
  const PRODUCTS = new Set(['lpg','naphtha','jetfuel','diesel','resid','gasoline','gasoil']);
  const GRADES = ['87summer','93summer','87winter','93winter'];
  const unique = (xs, allowed) => [...new Set(Array.isArray(xs) ? xs.filter(x=>allowed.has(x)) : [])];
  function normalize(raw) {
    const p = raw && typeof raw === 'object' ? raw : {};
    const out = {schemaVersion:2, rulesVersion:'refinery-16-2026-09', version:VERSION,
      phase:PHASES.has(String(p.phase))?String(p.phase):'1',
      product:PRODUCTS.has(p.product)?p.product:null,
      gasProduct:GRADES.includes(p.gasProduct)?p.gasProduct:'87summer',
      mapUnlocked:p.mapUnlocked === true,
      completedUnits:unique(p.completedUnits,UNIT_IDS),
      gasGradesCompleted:unique(p.gasGradesCompleted,new Set(GRADES)),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : null};
    for(const k of ['sruBestScore','sruBestTime','sruBestRecovered']) out[k]=Number.isFinite(p[k])&&p[k]>=0?p[k]:0;
    return out;
  }
  function createStore(storage, onStatus=()=>{}) {
    const key='fuelingCuriosity.v2.progress';
    let memory=null, loaded=false, available=true, protectedSave=false;
    const copy=()=>memory?normalize(memory):null;
    const fail=()=>{available=false;onStatus('temporary');};
    function read(){
      // One authoritative record per page session; failed writes must never reload stale disk data.
      if(loaded)return copy();
      loaded=true;
      let own,source;
      try{own=storage.getItem(key);source=own===null?storage.getItem('refineryRunProgress'):own;}
      catch{fail();return copy();}
      if(source===null)return copy();
      let parsed;
      try{parsed=JSON.parse(source);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Invalid progress');}
      catch{onStatus('recovered');return copy();}
      if(parsed.schemaVersion>2){protectedSave=true;available=false;onStatus('newer');return copy();}
      memory=normalize(parsed);
      if(own===null){try{storage.setItem(key,JSON.stringify(memory));onStatus('imported');}catch{fail();}}
      return copy();
    }
    function write(p){
      read(); // Detect a newer record even if the first operation is a write.
      memory=normalize(p);memory.updatedAt=new Date().toISOString();
      if(protectedSave){onStatus('newer');return copy();}
      try{storage.setItem(key,JSON.stringify(memory));available=true;onStatus('saved');}catch{fail();}
      return copy();
    }
    return {key,read,write,available:()=>available,
      clear(){return write({});},
      export(){return JSON.stringify(read()||normalize({}),null,2);},
      getItem(){const p=read();return p?JSON.stringify(p):null;},
      setItem(_key,value){try{return write(JSON.parse(value));}catch{onStatus('recovered');}},
      removeItem(){this.clear();}
    };
  }

  function createClock(owner, env={}) {
    const realNow=env.now||(()=>performance.now());
    const raf=env.raf||((fn)=>window.requestAnimationFrame(fn));
    const caf=env.caf||((id)=>window.cancelAnimationFrame(id));
    let previous=realNow(),time=0,paused=false,sequence=0,frame=null;
    const tasks=new Map();
    function refresh(){const now=realNow();if(!paused)time+=Math.max(0,now-previous);previous=now;}
    function ensure(){if(!paused&&frame===null&&tasks.size)frame=raf(pump);}
    function pump(){frame=null;refresh();try{if(!paused){const ready=[...tasks.entries()];for(const [id,t] of ready){if(!tasks.has(id)||t.due>time)continue;if(t.interval)t.due=time+t.delay;else tasks.delete(id);t.fn(...(t.frame?[time]:t.args));}}}finally{ensure();}}
    function add(fn,delay,interval,args,frameTask=false){refresh();const id=++sequence;tasks.set(id,{fn,delay:Math.max(interval?1:0,Number(delay)||0),due:time+(Number(delay)||0),interval,args,frame:frameTask,owner:String(owner())});ensure();return id;}
    const cancel=id=>tasks.delete(id);
    return {setTimeout:(fn,ms,...args)=>add(fn,ms,false,args),setInterval:(fn,ms,...args)=>add(fn,ms,true,args),clearTimeout:cancel,clearInterval:cancel,
      requestAnimationFrame:fn=>add(fn,0,false,[],true),cancelAnimationFrame:cancel,
      now(){refresh();return time;},pause(value){refresh();paused=Boolean(value);if(paused&&frame!==null){caf(frame);frame=null;}else ensure();},isPaused:()=>paused,
      cancelOwner(phase){for(const [id,t] of tasks)if(t.owner===String(phase))tasks.delete(id);},
      size:()=>tasks.size,
      destroy(){tasks.clear();if(frame!==null)caf(frame);frame=null;}
    };
  }
  return {VERSION,UNITS,GRADES,normalize,createStore,createClock};
});
if(typeof window!=='undefined'){
  window.GameRuntime={clock:null,paused:false,physics:null,store:FC.createStore({
    getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value),removeItem:key=>window.localStorage.removeItem(key)
  },status=>window.dispatchEvent(new CustomEvent('fc:storage',{detail:status})))};
}
