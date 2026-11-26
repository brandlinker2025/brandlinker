export type AgreementTerms = { agreementId:string; evidenceId:string; status:"draft"|"approved"|"revoked"; approvedBy:string|null; validFrom:string; validUntil:string; commissionBasisPoints:number };
export function calculateCommission(amountMinor:number,terms:AgreementTerms,asOf:string):number {
 if(!Number.isSafeInteger(amountMinor)||amountMinor<0)throw new Error("Invalid amount");
 if(terms.status!=="approved"||!terms.approvedBy?.trim()||!terms.evidenceId.trim()||!terms.agreementId.trim())throw new Error("Verified agreement required");
 const dates=[terms.validFrom,terms.validUntil,asOf].map(s=>Date.parse(s));
 if(dates.some(d=>!Number.isFinite(d))||dates[0]>dates[1]||dates[2]<dates[0]||dates[2]>dates[1])throw new Error("Agreement not effective");
 if(!Number.isInteger(terms.commissionBasisPoints)||terms.commissionBasisPoints<0||terms.commissionBasisPoints>10000)throw new Error("Invalid commission rate");
 const result=(BigInt(amountMinor)*BigInt(terms.commissionBasisPoints)+BigInt(5000))/BigInt(10000);
 return Number(result);
}
