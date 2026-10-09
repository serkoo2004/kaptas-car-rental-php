export type BuyVsLeaseInput = {
  vehiclePrice: number;
  downPayment: number;
  creditCost: number;
  mtv: number;
  insurance: number;
  casco: number;
  maintenance: number;
  tire: number;
  depreciation: number;
  operationTimeCost: number;
  leaseMonthly: number;
  months: number;
};

export function calculateBuyVsLease(input: BuyVsLeaseInput) {
  const ownershipCost =
    input.vehiclePrice +
    input.creditCost +
    input.mtv +
    input.insurance +
    input.casco +
    input.maintenance +
    input.tire +
    input.operationTimeCost -
    input.downPayment;

  const depreciationAdjustedOwnership = ownershipCost + input.depreciation;
  const leaseTotal = input.leaseMonthly * input.months;

  return {
    ownershipTotal: depreciationAdjustedOwnership,
    leaseTotal,
    ownershipMonthly: depreciationAdjustedOwnership / input.months,
    leaseMonthly: input.leaseMonthly,
    cashFlowAdvantage: Math.max(input.vehiclePrice - input.downPayment, 0),
    operationalDifference:
      input.maintenance + input.tire + input.insurance + input.casco,
    difference: depreciationAdjustedOwnership - leaseTotal,
  };
}

export function toNumber(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

export function formatTry(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    currency: "TRY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
