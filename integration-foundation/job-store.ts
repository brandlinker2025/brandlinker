import type {JobState} from "./policy";
export type Job = {id:string; agentId:string; state:JobState; revision:number; createdAt:string; updatedAt:string; idempotencyKey:string};
export interface JobStore {
 createOrGet(job:Job):Promise<Job>;
 get(id:string):Promise<Job|null>;
 compareAndSet(id:string,expectedRevision:number,next:Job):Promise<boolean>;
}
// Implementations must enforce unique idempotency keys and atomic revision checks in durable storage.
