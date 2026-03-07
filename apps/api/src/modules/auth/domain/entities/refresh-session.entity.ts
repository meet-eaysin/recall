export interface RefreshSessionEntityProps {
  id: string;
  sessionId: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
}

export class RefreshSessionEntity {
  constructor(public readonly props: RefreshSessionEntityProps) {}

  get sessionId(): string {
    return this.props.sessionId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isActive(now = new Date()): boolean {
    return (
      !this.props.revokedAt && this.props.expiresAt.getTime() > now.getTime()
    );
  }
}
