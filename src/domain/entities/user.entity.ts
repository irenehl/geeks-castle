export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public password?: string,
  ) {}

  static create(props: {
    id: string;
    username: string;
    email: string;
    password?: string;
  }): User {
    return new User(props.id, props.username, props.email, props.password);
  }

  hasPassword(): boolean {
    return Boolean(this.password);
  }

  updatePassword(password: string): void {
    this.password = password;
  }

  toPlainObject(): {
    id: string;
    username: string;
    email: string;
    password?: string;
  } {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      ...(this.password !== undefined ? { password: this.password } : {}),
    };
  }
}
