// Minimal sandbox-only owner console. Cloudflare Access cookie authenticates requests.
export const ownerConsoleHtml = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BoxVia BCDE | Owner</title><style>body{font:16px system-ui;max-width:700px;margin:5vh auto;padding:20px;line-height:1.5}input,button{font:inherit;padding:10px;margin:6px 0;width:100%;box-sizing:border-box}button{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#eee;padding:12px}</style><h1>BoxVia | Commercial Documents</h1><p>Owner-only sandbox. No automatic client sending.</p><button id="r2probe">Check private R2 storage (synthetic data only)</button><button id="pdfprobe">Check synthetic PDF pack in R2 (no order needed)</button><label>Order ID<input id="order" autocomplete="off" placeholder="Order UUID"></label><button id="generate">Generate archived PDF pack</button><button data-file="01_ORDER_TERMS.pdf">Download order terms</button><button data-file="02_ACCEPTANCE_RECORD.pdf">Download acceptance record</button><button data-file="manifest.json">Download manifest</button><pre id="result" role="status"></pre><script>
const out=document.getElementById("result");
async function call(action,file){
 const orderId=document.getElementById("order").value.trim();
 if(!/^[a-f0-9-]{36}$/i.test(orderId)){out.textContent="Valid order ID required";return;}
 const u="/api/bcde/"+action+"?orderId="+encodeURIComponent(orderId)+(file?"&file="+encodeURIComponent(file):"");
 try{
  const r=await fetch(u,{method:action==="generate"?"POST":"GET",credentials:"same-origin",cache:"no-store"});
  if(!r.ok){out.textContent=JSON.stringify(await r.json(),null,2);return;}
  if(file){const blob=await r.blob(),href=URL.createObjectURL(blob),a=document.createElement("a");a.href=href;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);out.textContent="Downloaded "+file;}
  else out.textContent=JSON.stringify(await r.json(),null,2);
 }catch{out.textContent="Request failed";}
}
document.getElementById("r2probe").onclick=async()=>{try{const r=await fetch("/api/bcde/r2-probe",{method:"POST",credentials:"same-origin",cache:"no-store"});out.textContent=JSON.stringify(await r.json(),null,2);}catch{out.textContent="R2 diagnostic request failed";}};
document.getElementById("pdfprobe").onclick=async()=>{try{const r=await fetch("/api/bcde/pdf-probe",{method:"POST",credentials:"same-origin",cache:"no-store"});out.textContent=JSON.stringify(await r.json(),null,2);}catch{out.textContent="Synthetic PDF diagnostic request failed";}};
document.getElementById("generate").onclick=()=>call("generate");
document.querySelectorAll("[data-file]").forEach(b=>b.onclick=()=>call("download",b.dataset.file));
</script></html>`;
