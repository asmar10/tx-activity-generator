import mongoose, { Document, Schema } from 'mongoose';

export interface IStats extends Document {
  date: Date;
  totalTransactions: number;
  successfulTx: number;
  failedTx: number;
  totalVolume: string;
  avgGasUsed: string;
  instancesRun: number;
}

const StatsSchema = new Schema<IStats>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    successfulTx: {
      type: Number,
      default: 0,
    },
    failedTx: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: String,
      default: '0',
    },
    avgGasUsed: {
      type: String,
      default: '0',
    },
    instancesRun: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Stats = mongoose.model<IStats>('Stats', StatsSchema);
