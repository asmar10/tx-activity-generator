import mongoose, { Document, Schema } from 'mongoose';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface ITransaction extends Document {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  gasUsed: string;
  status: TransactionStatus;
  instanceId: string;
  error?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    from: {
      type: String,
      required: true,
      index: true,
    },
    to: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: String,
      required: true,
    },
    gasUsed: {
      type: String,
      default: '0',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    instanceId: {
      type: String,
      required: true,
      index: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for 7-day retention
TransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
