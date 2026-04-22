export type Permission = {
  module_name: string;
  action: "view" | "add" | "edit" | "delete";
};

export function can(
  permissions: Permission[],
  moduleName: string,
  action: "view" | "add" | "edit" | "delete" | "view",
): boolean {
  return permissions.some(
    (p) =>
      p.module_name === moduleName &&
      (p.action === action || (p.action === "view" && action === "view")),
  );
}
