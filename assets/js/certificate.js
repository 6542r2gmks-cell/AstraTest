'use strict';
const certificateUnits=[{"id": "extraction", "label": "Crude Oil Extraction"}, {"id": "desalter", "label": "Crude Desalting"}, {"id": "distillation", "label": "Atmospheric Distillation"}, {"id": "pump-swap", "label": "Primary Pump Swap (Hot Standby)"}, {"id": "hydrotreating", "label": "Hydrotreating (Sulfur Removal)"}, {"id": "alky", "label": "HF Alkylation"}, {"id": "reformer", "label": "Catalytic Reforming"}, {"id": "vac", "label": "Vacuum Distillation"}, {"id": "coker", "label": "Delayed Coking"}, {"id": "fcc", "label": "Fluid Catalytic Cracking (FCC)"}, {"id": "pipe-xray", "label": "Pipe X-Ray Maintenance"}, {"id": "gasoline", "label": "Gasoline Blending & Certification"}, {"id": "jetfuel", "label": "Jet Fuel Inspection & Certification"}, {"id": "ulsd", "label": "ULSD Treatment & Additives"}, {"id": "logistics", "label": "Product Logistics & Delivery"}, {"id": "sru", "label": "Sulfur Recovery Unit (SRU)"}];
document.addEventListener('DOMContentLoaded',()=>{
  const progress=GameRuntime.store.read();
  if(!progress||!FC.UNITS.every(u=>progress.completedUnits.includes(u.id)))return;
  document.getElementById('certificate-locked').hidden=true;
  document.getElementById('certificate-ready').hidden=false;
  const list=document.getElementById('certificate-units');
  certificateUnits.forEach(u=>{const li=document.createElement('li');li.textContent=u.label;list.append(li);});
  document.getElementById('certificate-date').textContent=`Issued ${new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})} · V2 · 16-unit completion`;
  const input=document.getElementById('explorer-name');
  input.addEventListener('input',()=>{document.getElementById('certificate-name').textContent=input.value.trim()||'A curious explorer';});
  document.getElementById('print-certificate').addEventListener('click',()=>window.print());
});
