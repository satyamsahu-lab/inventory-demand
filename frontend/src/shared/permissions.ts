export type Permission = {
  module_name: string;
  action: 'view' | 'add' | 'edit' | 'delete';
};

export function can(
  permissions: Permission[],
  moduleName: string,
  action: Permission['action']
): boolean {
  return permissions.some((p) => p.module_name === moduleName && p.action === action);
}
