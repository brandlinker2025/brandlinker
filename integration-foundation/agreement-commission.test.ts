import assert from "node:assert/strict";
import {calculateCommission,type AgreementTerms} from "./agreement-commission";
const terms:AgreementTerms={agreementId:"test",evidenceId:"fixture",status:"approved",approvedBy:"test-admin",validFrom:"2026-01-01",validUntil:"2026-12-31",commissionBasisPoints:250};
assert.equal(calculateCommission(100000,terms,"2026-06-01"),2500);
assert.throws(()=>calculateCommission(100000,{...terms,status:"draft"},"2026-06-01"));
assert.throws(()=>calculateCommission(100000,{...terms,evidenceId:""},"2026-06-01"));
assert.throws(()=>calculateCommission(100000,terms,"2027-01-01"));
assert.throws(()=>calculateCommission(-1,terms,"2026-06-01"));
assert.throws(()=>calculateCommission(100000,{...terms,commissionBasisPoints:10001},"2026-06-01"));
