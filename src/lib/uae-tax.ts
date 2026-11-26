// UAE VAT statutory applicability evaluator based on Federal Decree-Law No. (8) of 2017

export type VatEvaluationParams = {
  isSupplierVatRegistered: boolean;
  supplierTrn?: string; // Tax Registration Number (15 digits)
  clientResidency: "uae_resident" | "overseas_non_resident";
  propertyLocation: "uae" | "international";
};

export type VatEvaluationResult = {
  vatApplicable: boolean;
  ratePercent: number;
  trnValidated: boolean;
  legalBasis: string;
};

export function evaluateUaeVat(params: VatEvaluationParams): VatEvaluationResult {
  // Rule 1: Supplier must be registered for VAT with the FTA
  if (!params.isSupplierVatRegistered) {
    return {
      vatApplicable: false,
      ratePercent: 0,
      trnValidated: false,
      legalBasis: "Supplier is not registered for UAE VAT (threshold under AED 375,000). VAT cannot legally be charged.",
    };
  }

  // TRN validation: UAE TRNs are 15-digit numbers starting with 100
  const trnValid = Boolean(params.supplierTrn && /^100\d{12}$/.test(params.supplierTrn.trim()));

  // Rule 2: Real estate situated in the UAE is treated as supplied in the UAE
  // Under Article 21 of the UAE VAT Executive Regulations, services related to real estate located in the UAE are supplied in the UAE
  if (params.propertyLocation === "uae") {
    return {
      vatApplicable: true,
      ratePercent: 5,
      trnValidated: trnValid,
      legalBasis: "Standard 5% UAE VAT applies. Real estate is situated in the UAE (Art. 21 Executive Regulations).",
    };
  }

  // Rule 3: Export of services outside the UAE
  if (params.clientResidency === "overseas_non_resident" && params.propertyLocation === "international") {
    return {
      vatApplicable: true,
      ratePercent: 0,
      trnValidated: trnValid,
      legalBasis: "Zero-rated (0% VAT) as export of services outside the State (Art. 31 Executive Regulations).",
    };
  }

  return {
    vatApplicable: true,
    ratePercent: 5,
    trnValidated: trnValid,
    legalBasis: "Standard 5% UAE VAT applicable.",
  };
}
