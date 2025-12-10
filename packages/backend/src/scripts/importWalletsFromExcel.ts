import * as XLSX from 'xlsx';
import path from 'path';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Wallet } from '../database/models';
import { encryptPrivateKey } from '../utils/encryption';
import logger from '../utils/logger';

interface WalletRow {
  Address?: string;
  PrivateKey?: string;
  Balance?: number;
  // Common column name variations
  address?: string;
  privateKey?: string;
  'Private Key'?: string;
  'private_key'?: string;
}

async function importWallets(): Promise<void> {
  const excelPath = process.argv[2] || path.resolve(__dirname, '../../../../wallets.xlsx');
  const maxWallets = parseInt(process.argv[3]) || 100;

  logger.info(`Reading Excel file: ${excelPath}`);
  logger.info(`Max wallets to import: ${maxWallets}`);

  // Read Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const rows: WalletRow[] = XLSX.utils.sheet_to_json(sheet);

  logger.info(`Found ${rows.length} rows in Excel file`);

  // Log first row to see column names
  if (rows.length > 0) {
    logger.info(`Column names: ${Object.keys(rows[0]).join(', ')}`);
  }

  // Connect to database
  await connectDatabase();

  // Clear existing wallets
  const existingCount = await Wallet.countDocuments();
  if (existingCount > 0) {
    logger.warn(`Deleting ${existingCount} existing wallets...`);
    await Wallet.deleteMany({});
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < Math.min(rows.length, maxWallets); i++) {
    const row = rows[i];

    // Try to find address and private key with various column names
    const address = row.Address || row.address || '';
    const privateKey = row.PrivateKey || row.privateKey || row['Private Key'] || row.private_key || '';

    if (!address || !privateKey) {
      errors.push(`Row ${i + 1}: Missing address or private key`);
      continue;
    }

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      errors.push(`Row ${i + 1}: Invalid address format: ${address}`);
      continue;
    }

    // Validate private key format
    let formattedKey = privateKey;
    if (!formattedKey.startsWith('0x')) {
      formattedKey = '0x' + formattedKey;
    }
    if (formattedKey.length !== 66) {
      errors.push(`Row ${i + 1}: Invalid private key length`);
      continue;
    }

    try {
      const encryptedKey = encryptPrivateKey(formattedKey);

      await Wallet.create({
        address: address.toLowerCase(),
        privateKey: encryptedKey,
        index: i,
        balance: '0',
      });

      imported++;

      if (imported % 10 === 0) {
        logger.info(`Imported ${imported} wallets...`);
      }
    } catch (error: any) {
      errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  logger.info('');
  logger.info('=== Import Complete ===');
  logger.info(`Successfully imported: ${imported} wallets`);
  logger.info(`Errors: ${errors.length}`);

  if (errors.length > 0 && errors.length <= 10) {
    logger.warn('Errors:');
    errors.forEach(e => logger.warn(`  ${e}`));
  } else if (errors.length > 10) {
    logger.warn(`First 10 errors:`);
    errors.slice(0, 10).forEach(e => logger.warn(`  ${e}`));
  }

  // Show sample of imported wallets
  const sampleWallets = await Wallet.find().limit(5).sort({ index: 1 });
  logger.info('');
  logger.info('Sample imported wallets:');
  sampleWallets.forEach(w => {
    logger.info(`  ${w.index}: ${w.address}`);
  });

  await disconnectDatabase();
  process.exit(0);
}

importWallets().catch((error) => {
  logger.error('Import failed', { error });
  process.exit(1);
});
