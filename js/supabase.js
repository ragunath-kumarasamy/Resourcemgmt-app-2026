/* ===================================================================
   SUPABASE DATA LAYER
   Keys are NOT hardcoded here. They are read from window.APP_CONFIG,
   which is defined in config.js (git-ignored). Copy config.sample.js
   to config.js and paste your Project URL + anon public key there.
   =================================================================== */
var CFG = (window.APP_CONFIG||{});
var SUPABASE_URL = CFG.SUPABASE_URL || "";
var SUPABASE_KEY = CFG.SUPABASE_KEY || "";
let supa = null;
let CLOUD = false;
function initSupabase(){
  var urlOk = SUPABASE_URL && SUPABASE_URL.indexOf('http')===0 && SUPABASE_URL.indexOf('PASTE_')!==0;
  var keyOk = SUPABASE_KEY && SUPABASE_KEY.indexOf('PASTE_')!==0;
  if(urlOk && keyOk && window.supabase){
    supa = window.supabase.createClient(SUPABASE_URL.replace(/\/+$/,''), SUPABASE_KEY);
    CLOUD = true;
  }
  updateCloudBadge();
}
function updateCloudBadge(){
  var el = document.getElementById('cloudBadge');
  if(el) el.innerHTML = CLOUD
    ? '<span class="cloudOn">● Connected to Supabase</span>'
    : '<span class="cloudOff">○ Offline (local browser)</span>';
}
async function cloudLoadAll(){
  if(!CLOUD) return false;
  try{
    const [r,a,al,lg] = await Promise.all([
      supa.from('resources').select('*').order('resource_name'),
      supa.from('accounts').select('*').order('account_name'),
      supa.from('allocations').select('*'),
      supa.from('logs').select('*').order('created_at',{ascending:false}).limit(200)
    ]);
    if(r.error||a.error||al.error) throw (r.error||a.error||al.error);
    resources   = (r.data||[]).map(x=>({id:x.id,resourceName:x.resource_name,email:x.email,role:x.role,department:x.department,employeeType:x.employee_type,reportingManager:x.reporting_manager,teamHead:x.team_head,resourceGeo:x.resource_geo||'EMEA',status:x.status||'Active'}));
    accounts    = (a.data||[]).map(x=>({id:x.id,accountName:x.account_name,geo:x.geo,accountOwner:x.account_owner,startDate:x.start_date,endDate:x.end_date,status:x.status,fromAccountSheet:true}));
    allocations = (al.data||[]).map(x=>({id:x.id,resourceId:x.resource_id,accountId:x.account_id,projectName:x.project_name,month:String(x.allocation_month).slice(0,7),allocationPercentage:Number(x.allocation_percentage),projectGeo:x.project_geo,comments:x.comments}));
    logs        = (lg.data||[]).map(x=>({module:x.module,action:x.action,entityName:x.entity_name,updatedBy:x.updated_by,createdAt:x.created_at}));
    return true;
  }catch(e){ console.error('Supabase load failed',e); alert('Supabase load failed: '+e.message); return false; }
}
async function cloudPushFromMemory(){
  if(!CLOUD){ alert('Add your Supabase URL + anon key in config.js first.'); return; }
  try{
    const rRows = resources.map(r=>({id:r.id,resource_name:r.resourceName,email:r.email,role:r.role,department:r.department,employee_type:r.employeeType,reporting_manager:r.reportingManager,team_head:r.teamHead,resource_geo:r.resourceGeo,status:r.status}));
    let e1=(await supa.from('resources').upsert(rRows,{onConflict:'id'})).error; if(e1) throw e1;
    const aRows = accounts.map(a=>({id:a.id,account_name:a.accountName,geo:a.geo,account_owner:a.accountOwner,start_date:a.startDate||null,end_date:a.endDate||null,status:a.status}));
    let e2=(await supa.from('accounts').upsert(aRows,{onConflict:'account_name'})).error; if(e2) throw e2;
    const alRows = allocations.map(x=>({resource_id:x.resourceId,account_id:x.accountId,project_name:x.projectName,allocation_month:x.month+'-01',allocation_percentage:x.allocationPercentage,project_geo:x.projectGeo,comments:x.comments,is_locked:x.month<currentMonth}));
    for(let i=0;i<alRows.length;i+=500){
      let e3=(await supa.from('allocations').upsert(alRows.slice(i,i+500),{onConflict:'resource_id,account_id,allocation_month'})).error; if(e3) throw e3;
    }
    await supa.from('logs').insert([{module:'System',action:'Pushed both sheets to Supabase',entity_name:'resource+account import',updated_by:'admin'}]);
    alert('Pushed to Supabase:\n'+rRows.length+' resources\n'+aRows.length+' accounts\n'+alRows.length+' allocations');
    await cloudLoadAll();
    renderHome();
  }catch(e){ console.error(e); alert('Push failed: '+e.message); }
}
async function cloudUpdateAllocation(resourceId,accountId,month,value){
  if(!CLOUD) return;
  try{
    await supa.from('allocations').upsert(
      [{resource_id:resourceId,account_id:accountId,allocation_month:month+'-01',allocation_percentage:Number(value||0),is_locked:month<currentMonth}],
      {onConflict:'resource_id,account_id,allocation_month'});
    await supa.from('logs').insert([{module:'Allocation',action:'Allocation updated',entity_name:resourceId,updated_by:'admin'}]);
  }catch(e){ console.error('cloud update failed',e); }
}
