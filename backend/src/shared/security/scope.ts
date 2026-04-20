export type RoleName = 'Super Admin' | 'Admin' | 'User';

export type AuthUser = {
  id: string;
  role: {
    id: string;
    name: RoleName;
  };
  createdByAdminId: string | null;
};

export function resolveScopeAdminId(user: AuthUser): string {
  // Everything is scoped per-admin.
  // - Super Admin: scope is self unless explicitly choosing otherwise (endpoints can add optional admin filter)
  // - Admin: scope is self
  // - User: scope is their creator admin
  if (user.role.name === 'User') {
    if (!user.createdByAdminId) {
      return user.id;
    }
    return user.createdByAdminId;
  }

  return user.id;
}
