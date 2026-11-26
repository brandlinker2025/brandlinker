export type IntegrationEvidence={platformId:string; configured:boolean; buildPassed:boolean; liveProbePassed:boolean; checkedAt:string|null; externalBlocker?:string};
export function integrationStatus(e:IntegrationEvidence):"blocked"|"unconfigured"|"configured"|"verified_live"{
 if(e.externalBlocker)return "blocked";
 if(!e.configured)return "unconfigured";
 if(e.buildPassed&&e.liveProbePassed&&e.checkedAt&&Number.isFinite(Date.parse(e.checkedAt)))return "verified_live";
 return "configured";
}
