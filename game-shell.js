/* UI, navigation, local progress tools, and equivalent pointer controls. */
'use strict';
(function(){
  const $=id=>document.getElementById(id);
  let booted=false,toastTimer=null,chosenObject=null,altPhase=null,confirmAction=null;
  let stopAlternativeHold=()=>{};
  let latestStorage='saved';
  const directPointer='#rfm-tap-btn,.comp-tank-body,.ulsd-tote-unit,#jet-accept,#jet-reject,.fcc-feed-mol';
  const stationaryPhases=new Set(['0','1','2','5','transport','finale','pump-swap','pipe-xray','sru']);
  function snapshot(){return window.Game?.getProgress?.()||FC.normalize(GameRuntime.store.read());}
  function unitFor(p){return FC.UNITS.find(u=>u.phase===p.activePhase&&(u.phase!=='4'||u.product===p.product));}
  function toast(message){$('game-toast').textContent=message;$('game-toast').classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('game-toast').classList.remove('show'),4200);}
  function setPaused(paused){
    if(paused)stopAlternativeHold();
    GameRuntime.paused=paused;GameRuntime.clock?.pause(paused);
    if(GameRuntime.physics) GameRuntime.physics.enabled=!paused&&!stationaryPhases.has(snapshot().activePhase);
    document.body.classList.toggle('v2-paused',paused);
  }
  function showPause(){
    if(!booted)return;
    const p=snapshot(),unit=unitFor(p);
    $('help-copy').textContent=unit?`${unit.hint} Game time is paused while you read.`:'Game time is paused. Resume when you are ready.';
    setPaused(true);
    if(!$('pause-dialog').open&&!$('confirm-dialog').open)$('pause-dialog').showModal();
  }
  function resume(){
    if($('pause-dialog').open)$('pause-dialog').close();
    if(!$('confirm-dialog').open)setPaused(false);
  }
  function ask(title,copy,action){confirmAction=action;setPaused(true);$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;$('confirm-dialog').showModal();}
  function closeConfirm(){confirmAction=null;$('confirm-dialog').close();setPaused(false);}
  function jump(unit){resume();Game.mapJump(unit.phase,unit.product);$('game-container').scrollIntoView({block:'start',behavior:'smooth'});}
  function render(){
    if(!booted)return;
    const p=snapshot(),unit=unitFor(p),done=p.completedUnits;
    $('passport-count').innerHTML=`${done.length} <span>/ 16</span>`;
    $('mobile-count').textContent=`${done.length}/16`;$('passport-progress').value=done.length;
    $('passport-note').textContent=p.mapUnlocked?'Your map is open. Choose a unit to explore or replay.':'Complete a delivery to open the map. Your progress is already being recorded.';
    $('passport-units').replaceChildren();
    FC.UNITS.forEach((u,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.className='passport-unit';btn.disabled=!p.mapUnlocked;
      const complete=done.includes(u.id);btn.classList.toggle('done',complete);btn.classList.toggle('current',u.id===unit?.id);
      if(u.id===unit?.id)btn.setAttribute('aria-current','step');
      btn.setAttribute('aria-label',`${u.label}${complete?', completed':''}${p.mapUnlocked?', open activity':', unlock map after delivery'}`);
      const n=document.createElement('span');n.className='unit-number';n.textContent=String(i+1).padStart(2,'0');
      const label=document.createElement('span');label.textContent=u.label;
      const status=document.createElement('span');status.className='unit-state';status.textContent=complete?'✓':p.mapUnlocked?'↗':'—';status.setAttribute('aria-hidden','true');
      btn.append(n,label,status);btn.addEventListener('click',()=>jump(u));$('passport-units').append(btn);
    });
    $('certificate-link').hidden=done.length!==FC.UNITS.length;
    const phase=p.activePhase;
    $('lesson-index').textContent=unit?`UNIT ${String(FC.UNITS.indexOf(unit)+1).padStart(2,'0')}`:phase==='finale'?'DELIVERY COMPLETE':phase==='transport'?'ON THE MOVE':'START HERE';
    $('lesson-objective').textContent=unit?.objective||(phase==='finale'?'A useful product. A job well done.':'From crude to consumer.');
    $('lesson-hint').textContent=unit?.hint||'One delivery opens the map. All 16 units unlock your Explorer certificate.';
    const saved=GameRuntime.store.read();
    if(saved&&saved.phase!=='0'&&saved.phase!=='finale'&&saved.phase!=='transport'){
      $('start-run').textContent='Continue your run →';
      const dest=FC.UNITS.find(u=>u.phase===saved.phase&&(u.phase!=='4'||u.product===saved.product));
      $('start-save-note').textContent=`Continue at ${dest?.label||'your saved checkpoint'}. Unfinished activities restart.`;
    }else if(p.mapUnlocked){$('start-run').textContent='Start another delivery →';$('start-save-note').textContent='Your completed units are kept. Or choose any activity in your passport.';}
    const next=FC.UNITS.find(u=>!done.includes(u.id));
    $('next-mission').hidden=phase!=='finale';
    if(phase==='finale'){
      $('next-title').textContent=next?next.label:'Your Explorer passport is complete.';
      $('next-description').textContent=next?next.hint:'Print your certificate, or revisit gasoline blending and sulfur recovery for another challenge.';
      $('next-play').textContent=next?'Explore this unit':'Open your certificate';
      $('next-play').onclick=()=>next?jump(next):window.location.assign('certificate.html');
    }
    setupAlternatives(phase);
  }
  function downloadProgress(){const blob=new Blob([GameRuntime.store.export()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='refinery-run-progress.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progress copy downloaded. Keep it for this learner or group.');}
  function restoreProgress(file){
    if(!file)return;
    if(file.size>20000){toast('That file is too large to be a game progress copy.');return;}
    file.text().then(text=>{
      let raw;try{raw=JSON.parse(text);}catch{throw Error('Choose a valid Refinery Run JSON progress file.');}
      if(!raw||typeof raw!=='object'||!Array.isArray(raw.completedUnits)||!('phase'in raw)||(raw.schemaVersion&&raw.schemaVersion>2))throw Error('This is not a supported Refinery Run progress file.');
      ask('Restore this progress?',`${FC.normalize(raw).completedUnits.length} completed units will replace the v2 record on this browser. Save a copy of your current progress first if you need it.`,()=>{GameRuntime.store.write(raw);closeConfirm();Game.reloadProgress();render();});
    }).catch(err=>toast(err.message));
  }
  function pointer(el,type,x,y){el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:99,pointerType:'mouse',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y}));}
  function decorateControls(){
    document.querySelectorAll(directPointer).forEach(el=>{
      if(!el.matches('button,input,select')){el.tabIndex=0;el.setAttribute('role','button');}
      if(!el.getAttribute('aria-label')){
        let name=el.classList.contains('comp-tank-body')?'Add blending component':el.classList.contains('ulsd-tote-unit')?'Add treatment dose':el.classList.contains('fcc-feed-mol')?'Tap to crack feed molecule':'Operate control';
        if(el.classList.contains('comp-tank-body'))name=`Add ${el.dataset.comp||el.dataset.component||el.closest('.component-column')?.innerText?.split('\n')[0]||'blending component'}`;
        if(el.classList.contains('ulsd-tote-unit'))name=`Add ${el.querySelector('strong')?.textContent||'treatment'} dose`;
        el.setAttribute('aria-label',name);
      }
    });
    refreshAlternativeTargets();
  }
  function setupAlternatives(phase){
    if(altPhase===phase)return;stopAlternativeHold();stopAlternativeHold=()=>{};altPhase=phase;chosenObject=null;
    const host=$('alternative-controls');host.replaceChildren();host.hidden=!['alky','fcc','coker'].includes(phase);
    if(host.hidden)return;
    const title=document.createElement('h3');title.textContent='Another way to use the controls';host.append(title);
    const hint=document.createElement('p');hint.id='alt-hint';host.append(hint);
    if(phase==='coker'){
      hint.textContent='During hydroblasting, choose a nozzle depth and hold the water button. You can still drag in the drum.';
      const label=document.createElement('label');label.htmlFor='nozzle-depth';label.textContent='Nozzle depth';
      const slider=document.createElement('input');slider.type='range';slider.id='nozzle-depth';slider.min='5';slider.max='98';slider.value='45';
      const fire=document.createElement('button');fire.textContent='Hold to spray water';fire.type='button';
      let timer=null;
      const spray=()=>{const drum=$('coker-drum');if(!drum)return;const r=drum.getBoundingClientRect();pointer(drum,'pointermove',r.left+r.width/2,r.top+r.height*Number(slider.value)/100);};
      const stop=()=>{if(timer!==null)GameRuntime.clock.clearInterval(timer);timer=null;};
      stopAlternativeHold=stop;
      const start=()=>{if(GameRuntime.paused)return;stop();spray();timer=GameRuntime.clock.setInterval(spray,70);};
      fire.addEventListener('pointerdown',e=>{e.preventDefault();try{fire.setPointerCapture(e.pointerId);}catch{}start();});
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>fire.addEventListener(type,stop));
      fire.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();start();}});
      fire.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();stop();}});fire.addEventListener('blur',stop);
      host.append(label,slider,fire);
    }else{
      hint.textContent='Keep dragging, or select an object below and then select its destination. The same activity rules apply.';
      const targets=document.createElement('div');targets.id='alt-targets';
      const place=document.createElement('button');place.id='alt-place';place.disabled=true;place.textContent=phase==='fcc'?'Move selected catalyst to regenerator':'Move selected ASO to acid regeneration';
      place.addEventListener('click',()=>{
        const dest=document.querySelector(phase==='fcc'?'.fcc-drop-zone':'#alky-regen');
        if(!chosenObject?.isConnected||!dest){toast('Select an object that is still in the activity.');return;}
        const r=chosenObject.getBoundingClientRect(),d=dest.getBoundingClientRect();
        pointer(chosenObject,'pointerdown',r.left+r.width/2,r.top+r.height/2);
        pointer(chosenObject,'pointermove',d.left+d.width/2,d.top+d.height/2);
        pointer(chosenObject,'pointerup',d.left+d.width/2,d.top+d.height/2);
        chosenObject?.classList.remove('alt-target-selected');chosenObject=null;refreshAlternativeTargets();
      });host.append(targets,place);
    }
  }
  function refreshAlternativeTargets(){
    const target=$('alt-targets');if(!target)return;
    const objects=[...document.querySelectorAll(altPhase==='fcc'?'.fcc-cat--spent':'.alky-tar')].filter(el=>el.isConnected);
    if(chosenObject&&!objects.includes(chosenObject))chosenObject=null;
    // Preserve focus: rebuild only if the actual available object set changes.
    const prior=target._objects||[];
    if(objects.length!==prior.length||objects.some((el,i)=>el!==prior[i])){
      target._objects=objects;target.replaceChildren();
      objects.forEach((el,i)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=`Select ${altPhase==='fcc'?'catalyst':'ASO'} ${i+1}`;btn.addEventListener('click',()=>{chosenObject?.classList.remove('alt-target-selected');chosenObject=el;el.classList.add('alt-target-selected');$('alt-place').disabled=false;$('alt-hint').textContent='Object selected. Choose the destination button to move it.';});target.append(btn);});
    }
    $('alt-place').disabled=!chosenObject;
  }
  function focusPhase(){const screen=document.querySelector('.screen.active');const heading=screen?.querySelector('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
  function boot(){
    if(booted)return;booted=true;
    $('pause-open').addEventListener('click',showPause);$('resume-game').addEventListener('click',resume);
    $('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});
    $('return-start').addEventListener('click',()=>{resume();Game.returnToStart();});
    $('passport-jump').addEventListener('click',()=>{$('passport').scrollIntoView({behavior:'smooth'});});
    $('export-progress').addEventListener('click',downloadProgress);
    $('import-progress').addEventListener('change',e=>{restoreProgress(e.target.files?.[0]);e.target.value='';});
    $('new-run').addEventListener('click',()=>ask('Start another delivery?','Your completed units stay in the passport. The current delivery and its gasoline-grade sequence restart.',()=>{closeConfirm();Game.resetGame();}));
    $('clear-progress').addEventListener('click',()=>ask('Clear v2 progress?','This clears v2 progress on this browser. Download a progress copy first if you want to keep it. Your original-version save is not changed.',()=>{GameRuntime.store.clear();closeConfirm();Game.reloadProgress();render();}));
    $('confirm-no').addEventListener('click',closeConfirm);$('confirm-yes').addEventListener('click',()=>{const action=confirmAction;confirmAction=null;action?.();});
    $('confirm-dialog').addEventListener('cancel',e=>{e.preventDefault();closeConfirm();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)showPause();});
    window.addEventListener('blur',()=>{document.querySelectorAll('.ulsd-tote-unit').forEach(el=>el.dispatchEvent(new PointerEvent('pointercancel',{pointerId:99,bubbles:true})));});
    document.addEventListener('keydown',e=>{
      if(GameRuntime.paused)return;
      if((e.key===' '||e.key==='Enter')&&e.target.matches(directPointer)){
        e.preventDefault();const r=e.target.getBoundingClientRect();pointer(e.target,'pointerdown',r.left+r.width/2,r.top+r.height/2);pointer(e.target,'pointerup',r.left+r.width/2,r.top+r.height/2);
      }
      const overlay=$('fun-fact-overlay');
      if(overlay.classList.contains('active')&&e.key==='Escape'){
        if(overlay.classList.contains('is-browser'))Game.closeFactsBrowser();else $('fun-fact-tap').click();
      }
      if(overlay.classList.contains('active')&&e.key==='Tab'){
        const buttons=[...overlay.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);
        if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);
        if(e.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){e.preventDefault();first.focus();}
      }
    });
    const observer=new MutationObserver(decorateControls);observer.observe($('game-container'),{childList:true,subtree:true});
    render();decorateControls();
    if(document.hidden)showPause();
  }
  window.addEventListener('fc:ready',boot);
  window.addEventListener('fc:progress',()=>{if(booted)render();});
  window.addEventListener('fc:phase',()=>{if(booted){render();focusPhase();}});
  window.addEventListener('fc:unit-complete',e=>{const u=FC.UNITS.find(u=>u.id===e.detail.unitId);toast(`${u?.label||'Unit'} completed. One more mark in your passport.`);});
  window.addEventListener('fc:storage',e=>{latestStorage=e.detail;const el=$('save-status');if(el)el.textContent=({temporary:'Temporary play: this browser cannot save progress.',recovered:'A save could not be read. Current play is still available.',newer:'Temporary play: your newer save is protected. Download a copy to keep this session.',imported:'Your earlier progress was copied into v2.',saved:'Progress stays on this browser.'})[latestStorage]||'Progress stays on this browser.';});
  window.addEventListener('DOMContentLoaded',()=>{if(window.Game?.getProgress)boot();window.setTimeout(()=>{if(!booted){$('boot-error').hidden=false;$('start-run').disabled=true;}},1500);});
})();
