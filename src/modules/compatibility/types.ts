export type CompatibilityStatus =
  | "unknown"
  | "compatible"
  | "incompatible";

export type CompatibilityCheckResult<
  TReason,
  TCompatibleDetails extends object | undefined = undefined,
> =
  | (TCompatibleDetails extends object
      ? { compatible: true } & TCompatibleDetails
      : { compatible: true })
  | {
      compatible: false;
      reason: TReason;
    };

export type CompatibilityEvaluationResult<
  TResult extends { compatible: boolean },
> = TResult | null;

export function getCompatibilityStatus(
  compatibilityResults: readonly CompatibilityEvaluationResult<{
    compatible: boolean;
  }>[],
): CompatibilityStatus {
  if (
    compatibilityResults.some(
      (compatibility) => compatibility?.compatible === false,
    )
  ) {
    return "incompatible";
  }

  if (compatibilityResults.some((compatibility) => compatibility === null)) {
    return "unknown";
  }

  return "compatible";
}
