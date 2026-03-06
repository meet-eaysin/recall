export interface UserActivityProps {
  id?: string;
  userId: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class UserActivityEntity {
  constructor(public readonly props: UserActivityProps) {}

  get id(): string | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): string {
    return this.props.type;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
