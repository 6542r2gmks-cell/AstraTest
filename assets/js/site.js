'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('.nav-toggle');const nav=document.querySelector('.nav');
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
  document.querySelectorAll('[data-print]').forEach(btn=>btn.addEventListener('click',()=>window.print()));
  const outline=document.getElementById('unit-outline');
  if(outline&&window.FC) FC.UNITS.forEach((u,i)=>{const div=document.createElement('div');const n=document.createElement('b');n.textContent=String(i+1).padStart(2,'0');const name=document.createElement('strong');name.textContent=u.label;const p=document.createElement('p');p.textContent=u.hint;div.append(n,name,p);outline.append(div);});
  const form=document.getElementById('feedback-form');
  form?.addEventListener('submit',e=>{e.preventDefault();const unit=document.getElementById('feedback-unit').value;const device=document.getElementById('feedback-device').value.trim();const message=document.getElementById('feedback-message').value.trim();if(!device||!message)return;const subject=`Refinery Run v2 feedback: ${unit}`;const body=`Version: 2.0.0-rc.2\nActivity: ${unit}\nDevice/browser: ${device}\n\nWhat happened:\n${message}\n\n`;document.getElementById('feedback-status').textContent='Your mail app should open with a draft. Review it before sending.';window.location.href=`mailto:hello@fuelingcuriosity.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;});
});
