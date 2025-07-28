import { AuditAction } from "../enums/audit-action.enum";

export function generateAuditDescription(
  action: AuditAction,
  entity: string,
  changes: Record<string, any>,
): string {
  const { before, after } = changes;

  switch (action) {
    case AuditAction.CREATE:
      return `Created ${entity}: ${Object.entries(after || {})
        .map(([k, v]) => `${k} = "${v}"`)
        .join(", ")}`;

    case AuditAction.UPDATE:
      if (!before || !after) return `Updated ${entity}`;
      const updatedFields = Object.keys(after).filter(
        (key) => before?.[key] !== after?.[key],
      );

      if (updatedFields.length === 0)
        return `No actual changes made to ${entity}`;

      return `Updated ${entity}: ${updatedFields
        .map((key) => `${key} changed from "${before[key]}" to "${after[key]}"`)
        .join("; ")}`;

    case AuditAction.DELETE:
      return `Deleted ${entity}: ${Object.entries(before || {})
        .map(([k, v]) => `${k} = "${v}"`)
        .join(", ")}`;

    case AuditAction.GET:
      return `Fetched list of ${entity}`;

    case AuditAction.SHOW:
      return `Viewed detail of ${entity}`;

    default:
      return `Performed ${action} on ${entity}`;
  }
}
