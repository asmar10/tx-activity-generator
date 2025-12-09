import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  address: string;
  privateKey: string;
  index: number;
  balance: string;
  lastActive: Date;
  totalTxSent: number;
  totalTxReceived: number;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    privateKey: {
      type: String,
      required: true,
    },
    index: {
      type: Number,
      required: true,
      unique: true,
    },
    balance: {
      type: String,
      default: '0',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    totalTxSent: {
      type: Number,
      default: 0,
    },
    totalTxReceived: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
