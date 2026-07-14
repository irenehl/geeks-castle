export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly email: string,
    public readonly hasPassword: boolean,
  ) {}
}
