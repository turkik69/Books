
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
};

function normalizeEmail(v:string){
  return String(v||"")
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,"")
    .replace(/\s+/g,"")
    .trim()
    .toLowerCase();
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({ok:false},405);

  try{
    const url=Deno.env.get("SUPABASE_URL");
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!service) return json({ok:false,error:"server_config_missing"},500);

    const body=await req.json().catch(()=>({}));
    const email=normalizeEmail(body?.email||"");
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
      return json({ok:true});
    }

    const admin=createClient(url,service);

    const {data:profile}=await admin
      .from("profiles")
      .select("id,email")
      .ilike("email",email)
      .maybeSingle();

    if(!profile?.id) return json({ok:true});

    const {data:userData}=await admin.auth.admin.getUserById(profile.id);
    const authEmail=normalizeEmail(userData?.user?.email||"");

    if(authEmail.endsWith("@warraq-users.com") && authEmail!==email){
      const {error:updateError}=await admin.auth.admin.updateUserById(profile.id,{
        email,
        email_confirm:true,
      });
      if(updateError) return json({ok:false,error:"legacy_email_upgrade_failed"},500);
    }

    return json({ok:true});
  }catch(e){
    return json({ok:false,error:"server_error"},500);
  }
});

function json(data:unknown,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...cors,"Content-Type":"application/json"},
  });
}
