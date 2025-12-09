export type UserRole = "admin" | "site_engineer" | "architect" | "vendor"

export class UserEntity {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly email: string,
    public readonly role: UserRole,
  ) {}

  isAdmin() {
    return this.role === "admin"
  }
}
