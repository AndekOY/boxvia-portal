export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/claim" || request.method !== "POST") return new Response("Not found", {status:404});
    if (!env.CLAIMS_DB || !env.RESEND_API_KEY || !env.MAIL_FROM) return new Response(JSON.stringify({error:"Service not configured"}),{status:503,headers:{"content-type":"application/json"}});
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return new Response("Forbidden", {status:403});
    const type = request.headers.get("content-type") || "";
    if (!type.includes("application/json")) return new Response("Unsupported media type", {status:415});
    if (Number(request.headers.get("content-length") || 0) > 12000) return new Response("Too large",{status:413});
    let body;
    try {body = await request.json();} catch {return new Response("Invalid JSON",{status:400});}
    const email=String(body.email||"").trim(), claim=String(body.exact_claim||"").trim(), source=String(body.primary_source_url||"").trim(), version=String(body.source_version_or_date||"").trim();
    if (body.bot_field) return Response.json({ok:true});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||claim.length<15||claim.length>2000||source.length>2000||version.length>160||body.public_material_confirmation!==true||body.terms_acknowledgement!==true) return new Response("Invalid submission",{status:400});
    try {const u=new URL(source);if(!["https:","http:"].includes(u.protocol)||u.username||u.password) throw Error();}catch{return new Response("Invalid source URL",{status:400});}
    const id=crypto.randomUUID();
    await env.CLAIMS_DB.prepare("INSERT INTO claims (id,email,exact_claim,primary_source_url,source_version_or_date,status) VALUES (?,?,?,?,?,'submitted')").bind(id,email,claim,source,version).run();
    const payload={from:env.MAIL_FROM,to:["andrzej.ekhmenin@gmail.com"],subject:"BoxVia Check a Claim - new submission "+id,text:["New claim request", "ID: "+id,"Email: "+email,"Claim: "+claim,"Source: "+source,"Version/date: "+version,"Payment status: not verified"].join("\n\n")};
    try {
      const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!r.ok) throw Error("Email provider failed");
      await env.CLAIMS_DB.prepare("UPDATE claims SET notification_sent=1 WHERE id=?").bind(id).run();
    } catch(e) {console.error("Notification failed for claim",id);}
    return Response.json({ok:true,id});
  }
};
