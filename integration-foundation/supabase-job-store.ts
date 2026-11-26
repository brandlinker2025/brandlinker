import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import type {Job,JobStore} from "./job-store";
const row=(j:Job)=>({id:j.id,agent_id:j.agentId,state:j.state,revision:j.revision,created_at:j.createdAt,updated_at:j.updatedAt,idempotency_key:j.idempotencyKey});
function job(r:any):Job{return {id:r.id,agentId:r.agent_id,state:r.state,revision:r.revision,createdAt:r.created_at,updatedAt:r.updated_at,idempotencyKey:r.idempotency_key};}
export class SupabaseJobStore implements JobStore{
 constructor(private db:SupabaseClient){}
 async createOrGet(j:Job):Promise<Job>{
 const {error}=await this.db.from("bl_jobs").upsert(row(j),{onConflict:"idempotency_key",ignoreDuplicates:true});
 if(error)throw new Error("Job insertion failed");
 const {data,error:readError}=await this.db.from("bl_jobs").select("*").eq("idempotency_key",j.idempotencyKey).single();
 if(readError||!data)throw new Error("Job retrieval failed");
 if(data.agent_id!==j.agentId)throw new Error("Idempotency conflict");
 return job(data);
 }
 async get(id:string):Promise<Job|null>{
 const {data,error}=await this.db.from("bl_jobs").select("*").eq("id",id).maybeSingle();
 if(error)throw new Error("Job retrieval failed");return data?job(data):null;
 }
 async compareAndSet(id:string,expectedRevision:number,next:Job):Promise<boolean>{
 if(next.id!==id||next.revision!==expectedRevision+1)throw new Error("Invalid revision");
 const {data,error}=await this.db.from("bl_jobs").update({state:next.state,revision:next.revision,updated_at:next.updatedAt}).eq("id",id).eq("revision",expectedRevision).select("id");
 if(error)throw new Error("Job update failed");return data?.length===1;
 }
}
export function createSupabaseJobStore():JobStore{
 if(typeof window!=="undefined")throw new Error("Server only");
 const url=process.env.BL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://enahlkxdplntriipabiu.supabase.co";
 const key=process.env.BL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)throw new Error("Central database not configured: BL_SUPABASE_SERVICE_KEY required");
 return new SupabaseJobStore(createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}));
}
