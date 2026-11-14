/* AI-assisted by OpenAI Codex. Presentation, source context and static visual comparison for the flame lab. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),lab=window.FlameLab;
 if(!lab)return;
 let step=0,free=false,pinned=null,started=false,seed=null,extinction=null,generation=0;
 const controls=Array.from(document.querySelectorAll('.demo-guide button,.lab-controls button,.lab-controls input,.lab-controls select,.row button,.chamber input,.interaction-options button,.mobile-lab-controls button'));
 const initialDisabled=new Map(controls.map(e=>[e,e.disabled]));controls.forEach(e=>e.disabled=true);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const outcome=r=>!r?'No selected record':r.ignited===false?'Did not ignite':r.outcome==='self_extinguished'?'Went out by itself':r.outcome==='burned'?'Kept burning':'Outcome not recorded';
 // The other gases in the chamber, where NASA's row states them (FLEX and CFI).
 const gases=r=>{if(r.n2_pct==null&&r.co2_pct==null&&r.he_pct==null)return'';const g=[[r.n2_pct,'nitrogen'],[r.co2_pct,'carbon dioxide'],[r.he_pct,'helium']].filter(x=>x[0]>0).map(x=>x[0].toFixed(0)+'% '+x[1]);return'<br>Rest of the gas: '+esc(g.join(', ')||'none');};
 const steps=[
  ['Start with one NASA record.','The reference card shows the original oxygen, pressure, fuel and recorded outcome. Everything moving in the chamber is an illustration.','Next: add gravity'],
  ['Add gravity. Keep the atmosphere.','The pinned frame is the same illustration at 0 g. Oxygen and pressure stay fixed. The live model now includes Earth gravity; NASA did not measure this altered case.','Next: ventilation'],
  ['Move gas without gravity.','Return to 0 g and add ventilation. Use Gas flow to see how forced flow can move gas even without buoyancy. The fan setting has no calibrated speed.','Next: extinction'],
  ['Separate an outcome from a prediction.','This selected test went out by itself in NASA’s table, and the reference card gives the burn time NASA recorded. Replay illustrates that outcome on the demo’s own clock.','Replay this outcome']
 ];
 function freeMode(){if(!started)return;generation++;free=true;$('demoStep').textContent='FREE EXPLORATION';$('demoTitle').textContent='Change a setting and compare.';$('demoText').textContent='The reference card keeps the original NASA record. The label above the controls tells you whether the live settings still match it.';$('demoNext').textContent='Resume guided demo';document.querySelectorAll('[data-demo]').forEach(b=>b.removeAttribute('aria-current'));}
 function selectStep(i){
  const token=++generation;step=i;free=false;const d=steps[i];$('demoStep').textContent='GUIDED DEMO / '+(i+1)+' OF 4';$('demoTitle').textContent=d[0];$('demoText').textContent=d[1];$('demoNext').textContent=d[2];$('demoPrev').disabled=i===0;document.querySelectorAll('[data-demo]').forEach(b=>{if(+b.dataset.demo===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('stirMode').checked=false;$('inspectModel').checked=false;
  if(i===0){clearPin();lab.apply({record:seed,g:0,wind:0,view:0});}
  if(i===1){const s=lab.state();if(!s.following||s.row.source!==seed.source||s.row.source_line!==seed.source_line||s.view!==0)lab.apply({record:seed,g:0,wind:0,view:0});lab.pin(result=>{if(token!==generation)return;setPin(result);lab.apply({record:seed,g:1,wind:0,view:0});});}
  if(i===2){lab.apply({record:seed,g:0,wind:30,view:3});}
  if(i===3){clearPin();lab.apply({record:extinction,g:0,wind:0,view:0});}
  render();
 }
 function setPin(result){pinned=result.state;$('pinnedView').hidden=false;$('chamberCompare').classList.add('comparing');$('pinnedImage').hidden=!result.image;$('pinnedFallback').hidden=!!result.image;if(result.image)$('pinnedImage').src=result.image;$('pinnedCaption').textContent=({0:'Flame',1:'Oxygen',2:'Heat',3:'Gas flow'}[pinned.view])+' · '+pinned.o2.toFixed(1)+'% oxygen · '+pinned.psi.toFixed(2)+' psi · '+pinned.g.toFixed(3)+' g · fan '+pinned.wind+'. Full-chamber view; not a NASA image.';$('restorePinned').disabled=false;render();}
 function clearPin(){pinned=null;$('pinnedView').hidden=true;$('chamberCompare').classList.remove('comparing');$('pinnedImage').removeAttribute('src');$('restorePinned').disabled=true;}
 function source(s){
  const r=s.reference;let h='';
  if(r){h='<div class="source-name">'+esc(r.investigation)+' · '+esc(r.test_id)+'</div><p class="source-values">'+r.o2_pct.toFixed(1)+'% O₂ · '+r.pressure_psi.toFixed(2)+' psi · 0 g<br>'+esc(r.fuel)+gases(r)+'</p><p class="source-outcome">NASA recorded: <strong>'+esc(outcome(r))+'</strong>'+(r.burn_time_s==null?'':' after '+r.burn_time_s+' s')+'</p><p class="source-file">'+esc(r.source)+', line '+r.source_line+'. <a href="https://psi.nasa.gov/physci/repo/data/investigations/'+encodeURIComponent(r.accession)+'" target="_blank" rel="noopener">Open NASA PSI</a></p>';}
  else h='<p>No reference test is selected. The live chamber uses a generic illustrative reaction.</p>';
  if($('sourceSummary').innerHTML!==h)$('sourceSummary').innerHTML=h;
  $('sourceRelation').textContent=s.following?'Original conditions':'Reference only';$('restoreRecord').disabled=!r;
 }
 function render(){
  if(!lab.ready)return;const s=lab.state();source(s);
  $('labMode').classList.toggle('modified',!s.following);$('labMode').textContent=s.following?(s.row.outcome==='unknown'&&s.row.ignited!==false?'NASA CONDITIONS / MODEL ILLUSTRATION':'NASA CONDITIONS / ILLUSTRATIVE REPLAY'):'MODIFIED CONDITIONS / OUTCOME UNKNOWN';
  $('currentO2').textContent=s.o2.toFixed(1)+'%';$('currentP').textContent=s.psi.toFixed(2)+' psi';$('currentPP').textContent=(s.o2*s.psi/100).toFixed(2)+' psi';$('liveConditions').textContent=s.g.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')+' g · fan '+s.wind;
  document.querySelectorAll('[data-quick-g]').forEach(b=>b.setAttribute('aria-pressed',Math.abs(+b.dataset.quickG-s.g)<.0001));$('quickFan').setAttribute('aria-pressed',s.wind>0);$('quickFan').textContent=s.wind>0?'Fan on':'Fan off';
  let insight=s.disturbed?'You stirred the model gas. This is no longer a replay at undisturbed recorded conditions. Restore the record to start that comparison again.':s.wind?'Ventilation imposes flow at '+s.g.toFixed(3)+' g. The fan can transport gas at 0 g; its strength here is a relative model setting.':s.g>0?'Buoyancy is added to the model. Compare the rising gas with the 0 g reference. The NASA record does not supply an outcome at this gravity.':!s.following?'These are custom conditions. The flame uses shared, hand-tuned reaction coefficients, so changing the displayed fuel context does not create a material-specific prediction.':'At the selected test’s original atmosphere and 0 g, the replay follows its recorded outcome. The shape, colours, size and timeline are generated by the model.';
  $('labInsight').textContent=insight;
  $('viewExplanation').textContent=s.view===1?'Oxygen view: estimated oxygen remaining in the model, not NASA sensor measurements. The white contour marks the model flame.':s.view===3?'Gas flow: arrows show directions in the model. Colours represent relative speed, without a calibrated cm/s scale.':'Flame view: a rendering of the model reaction. Colours and apparent dimensions are illustrative.';
  if(pinned){let lines=[['Gravity',pinned.g.toFixed(3)+' → '+s.g.toFixed(3)+' g'],['Oxygen',pinned.o2.toFixed(1)+' → '+s.o2.toFixed(1)+'%'],['Pressure',pinned.psi.toFixed(2)+' → '+s.psi.toFixed(1)+' psi'],['Ventilation',pinned.wind+' → '+s.wind+' (relative)']];$('comparisonChanges').innerHTML='<dl>'+lines.map(v=>'<dt>'+v[0]+'</dt><dd>'+v[1]+'</dd>').join('')+'</dl><p class="note">The pinned image is a frozen illustration. Both views use the full-chamber camera.</p>';}
  else $('comparisonChanges').textContent='Pin a view, then change one variable. The pinned reference stays still while the live model updates.';
  tick();
 }
 function tick(){if(!lab.ready)return;const s=lab.state(),r=s.row;let t=s.loop?s.time%(r&&r.ignited===false?6:12):s.time,ratio=0,phase='';
  if(!s.following){phase=s.paused?'Model paused':'Model running';}
  else if(r.ignited===false){ratio=Math.min(1,t/.25);phase=t<.25?'Illustrating igniter pulse':'Recorded: did not ignite';}
  else if(r.outcome==='self_extinguished'){ratio=Math.min(1,t/7);phase=t<7?'Replay: before extinction':'Recorded: went out';}
  else if(r.outcome==='burned'){ratio=Math.min(1,t/7);phase='Recorded: kept burning';}
  else phase='NASA outcome not recorded';
  $('sequenceProgress').style.width=ratio*100+'%';$('sequencePhase').textContent=phase;$('sequenceLabel').textContent=s.following?'Illustration time, not measured burn duration':'Model behavior, no measured outcome';
 }
 function setupLink(){const s=lab.state(),u=new URL(location.href);u.search='';if(s.css)u.searchParams.set('css','');const r=s.reference;if(r)u.searchParams.set('record',[r.accession,r.source,r.source_line].join('|'));u.searchParams.set('o2',s.o2);u.searchParams.set('psi',s.psi);u.searchParams.set('g',s.g);u.searchParams.set('fan',s.wind);u.searchParams.set('view',s.view);if(!s.row)u.searchParams.set('custom','1');if(s.disturbed)u.searchParams.set('stirred','1');u.hash='';return u.href;}
 function shared(){const q=new URLSearchParams(location.search),p={};if(!['o2','psi','g','fan','record'].some(k=>q.has(k)))return false;const r=lab.records().find(r=>[r.accession,r.source,r.source_line].join('|')===q.get('record'));if(r)p.record=r;for(const [key,name]of [['o2','o2'],['psi','psi'],['g','g'],['fan','wind'],['view','view']])if(q.has(key)&&q.get(key)!==''&&Number.isFinite(+q.get(key)))p[name]=+q.get(key);p.custom=q.get('custom')==='1';p.disturbed=q.get('stirred')==='1';lab.apply(p);return true;}
 function init(){if(started)return;started=true;controls.forEach(e=>e.disabled=initialDisabled.get(e));const records=lab.records();seed=records.filter(r=>r.investigation==='FLEX'&&r.outcome==='burned').sort((a,b)=>(Math.abs(a.o2_pct-21)+Math.abs(a.pressure_psi-14.7))-(Math.abs(b.o2_pct-21)+Math.abs(b.pressure_psi-14.7)))[0]||records[0];extinction=records.filter(r=>r.investigation==='FLEX'&&r.outcome==='self_extinguished').sort((a,b)=>Math.abs(a.pressure_psi-14.7)-Math.abs(b.pressure_psi-14.7))[0];if(shared()){freeMode();render();}else selectStep(0);}
 $('demoNext').onclick=()=>{if(free)selectStep(step);else if(step===3)lab.restart();else selectStep(step+1);};$('demoPrev').onclick=()=>selectStep(Math.max(0,step-1));$('demoRestart').onclick=()=>selectStep(0);document.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>selectStep(+b.dataset.demo));
 $('pulseGas').onclick=()=>{lab.pulse();freeMode();};$('pinView').onclick=()=>lab.pin(setPin);$('unpin').onclick=()=>{clearPin();render();};$('restorePinned').onclick=()=>{if(pinned){const p=pinned;lab.apply({record:p.row||p.reference,o2:p.o2,psi:p.psi,g:p.g,wind:p.wind,view:p.view,disturbed:p.disturbed,custom:!p.row});}};
 document.querySelectorAll('[data-quick-g]').forEach(b=>b.onclick=()=>{lab.apply({g:+b.dataset.quickG});freeMode();});$('quickFan').onclick=()=>{lab.apply({wind:lab.state().wind>0?0:30});freeMode();};
 $('restoreRecord').onclick=()=>{lab.restore();freeMode();};
 for(const [id,delta]of [['previousTest',-1],['nextTest',1]])$(id).onclick=()=>{const input=$('test');input.value=Math.max(0,Math.min(+input.max,+input.value+delta));input.dispatchEvent(new Event('input'));};
 $('zoom').addEventListener('click',()=>{if(pinned){clearPin();$('shareStatus').textContent='Pinned reference cleared because the camera changed.';}});
 document.querySelector('.lab-controls').addEventListener('input',e=>{if(e.target.matches('input,select'))freeMode();});document.querySelector('.lab-controls').addEventListener('change',e=>{if(e.target.matches('input,select'))freeMode();});document.querySelectorAll('[data-lab-preset]').forEach(b=>b.addEventListener('click',freeMode));
 $('inspectModel').onchange=()=>{if(!$('inspectModel').checked){document.getElementById('probe').hidden=true;}};
 $('shareSetup').onclick=async()=>{const url=setupLink();$('setupLink').value=url;$('setupLink').hidden=false;try{await navigator.clipboard.writeText(url);$('shareStatus').textContent='Setup link copied. It restores settings, not the current fluid field.';}catch(e){$('setupLink').select();$('shareStatus').textContent='Copy the setup link from this field.';}};
 document.addEventListener('lab-explore',()=>{freeMode();render();});document.addEventListener('lab-change',render);document.addEventListener('lab-tick',tick);document.addEventListener('lab-ready',()=>{init();lab.uiReady=true;document.dispatchEvent(new Event('lab-ui-ready'));});if(lab.ready){init();lab.uiReady=true;document.dispatchEvent(new Event('lab-ui-ready'));}
 function failed(){$('demoTitle').textContent='NASA test data is unavailable.';$('demoText').textContent='The lab needs the source records before it can load a test. Retry loading the data.';$('sourceSummary').textContent='No record loaded. No outcome is inferred.';$('demoRestart').disabled=false;$('demoRestart').textContent='Retry loading data';$('demoRestart').onclick=()=>location.reload();}
 document.addEventListener('lab-failed',failed);if(lab.failed)failed();
})();
