import assert from "node:assert/strict";
import { executeFree, type Adapter } from "./router";
const base={enabled:true,healthy:true,free:true,remaining:1,confidentialAllowed:false};
async function run(){
 const calls:string[]=[];
 const make=(id:string,output:string,free=true):Adapter=>({provider:{...base,id,free},execute:async()=>{calls.push(id);if(!output)throw new Error("Provider unavailable");return output;}});
 const adapters=[make("paid","bad",false),make("first",""),make("second","ok")];
 const result=await executeFree({prompt:"test",confidential:false},adapters,new AbortController().signal);
 assert.deepEqual(result,{status:"succeeded",providerId:"second",output:"ok"});
 assert.deepEqual(calls,["first","second"]);
 assert.deepEqual(await executeFree({prompt:"private",confidential:true},adapters,new AbortController().signal),{status:"unavailable",attempted:[]});
 await assert.rejects(executeFree({prompt:" ",confidential:false},adapters,new AbortController().signal));
 const controller=new AbortController();controller.abort();
 await assert.rejects(executeFree({prompt:"test",confidential:false},adapters,controller.signal));
}
void run().catch(error=>{console.error(error);process.exitCode=1;});
