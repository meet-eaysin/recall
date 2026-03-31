import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type {
  IExternalIdentityDocument,
  ExternalAuthProvider,
} from '../types/external-identity.type';

const externalIdentitySchema = new Schema<IExternalIdentityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['google', 'github'] satisfies ExternalAuthProvider[],
      required: true,
      index: true,
    },
    providerUserId: { type: String, required: true, index: true },
    email: { type: String },
    emailVerified: { type: Boolean, default: false },
    profileSnapshot: { type: Schema.Types.Mixed },
    linkedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

externalIdentitySchema.index(
  { provider: 1, providerUserId: 1 },
  { unique: true },
);

export const ExternalIdentityModel: Model<IExternalIdentityDocument> =
  (mongoose.models['ExternalIdentity'] as
    | Model<IExternalIdentityDocument>
    | undefined) ??
  mongoose.model<IExternalIdentityDocument>(
    'ExternalIdentity',
    externalIdentitySchema,
  );
