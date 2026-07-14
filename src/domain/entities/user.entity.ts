export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public password?: string,
    public mustChangePassword: boolean = false,
    public readonly createdAt?: string,
  ) {}

  static create(props: {
    id: string;
    username: string;
    email: string;
    password?: string;
    mustChangePassword?: boolean;
    createdAt?: string;
  }): User {
    return new User(
      props.id,
      props.username,
      props.email,
      props.password,
      props.mustChangePassword ?? false,
      props.createdAt,
    );
  }

  hasPassword(): boolean {
    return Boolean(this.password);
  }

  updatePassword(password: string, mustChangePassword = false): void {
    this.password = password;
    this.mustChangePassword = mustChangePassword;
  }

  toPlainObject(): {
    id: string;
    username: string;
    email: string;
    password?: string;
    mustChangePassword: boolean;
    createdAt?: string;
  } {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      mustChangePassword: this.mustChangePassword,
      ...(this.password !== undefined ? { password: this.password } : {}),
      ...(this.createdAt !== undefined ? { createdAt: this.createdAt } : {}),
    };
  }
}
