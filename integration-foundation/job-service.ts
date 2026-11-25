import {canTransition,type JobState} from "./policy";
import type {Job,JobStore} from "./job-store";
export async function transitionJob(store:JobStore,id:string,to:JobState):Promise<Job>{
 const current=await store.get(id);
 if(!current)throw new Error("Job not found");
 if(!canTransition(current.state,to))throw new Error("Invalid transition");
 const next:Job={...current,state:to,revision:current.revision+1,updatedAt:new Date().toISOString()};
 if(!await store.compareAndSet(id,current.revision,next))throw new Error("Concurrent update; retry after reading current state");
 return next;
}
