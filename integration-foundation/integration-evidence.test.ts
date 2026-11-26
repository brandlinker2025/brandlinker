import assert from "node:assert/strict";
import {integrationStatus} from "./integration-evidence";
const base={platformId:"test",configured:true,buildPassed:true,liveProbePassed:false,checkedAt:null};
assert.equal(integrationStatus(base),"configured");
assert.equal(integrationStatus({...base,configured:false}),"unconfigured");
assert.equal(integrationStatus({...base,externalBlocker:"missing token"}),"blocked");
assert.equal(integrationStatus({...base,liveProbePassed:true,checkedAt:"2026-11-26T00:00:00Z"}),"verified_live");
