import { pool, query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { ChunkingService } from '../services/chunking.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { VectorStoreService } from '../services/vector-store.service.js';
import { logger } from '../utils/logger.js';

const SAMPLE_DOCUMENT = `
# ACME Corporation Global Security & IT Policies

## Section 1: Remote Work & Device Management
Employees are permitted to work remotely from approved countries provided they use their ACME-issued MacBook Pro or Lenovo ThinkPad. 
Personal computers (BYOD) are strictly forbidden from connecting to production AWS databases. 
Full-disk encryption (FileVault for macOS, BitLocker for Windows) must be activated at all times.
All corporate laptops must run the SentinelOne security agent and connect via Cloudflare Zero Trust WARP VPN.

## Section 2: Password & Authentication Protocol
Passwords must be a minimum of 16 characters in length, containing uppercase letters, lowercase letters, numbers, and at least two symbols.
Multi-Factor Authentication (MFA) is strictly enforced via hardware security keys (YubiKey) or Okta Verify with push number-matching. 
SMS-based MFA is explicitly deprecated and prohibited due to SIM-swapping vulnerabilities. 
Passwords expire every 90 days. Account lockout triggers after 5 consecutive failed authentication attempts.

## Section 3: Data Classification & Retention
Data is classified into three tiers: Public, Internal, and Restricted.
- Public: Marketing materials and public documentation.
- Internal: Standard Slack discussions, Jira tickets, and non-sensitive source code.
- Restricted: Customer Personally Identifiable Information (PII), API keys, production database credentials, and financial audit records.
Customer data must be retained for exactly 7 years in accordance with SOC2 and GDPR compliance standards, after which it must be cryptographically erased using DoD 5220.22-M wiping procedures.

## Section 4: Travel Security & Expenses
When traveling internationally to Tier-3 security risk countries, employees must leave primary corporate laptops behind and requisition an ephemeral travel-burner laptop from IT SecOps.
Standard daily meal per-diem allowance is $85 USD within North America and $110 USD internationally. 
Itemized receipts are mandatory for any expense exceeding $25 USD.
`;

async function seed() {
  try {
    logger.info('Starting Enterprise RAG Seeder...');

    // 1. Create Demo User
    const email = 'demo@acmecorp.com';
    const password = 'Password123!';
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let [user] = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (!user) {
      [user] = await query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, hash]
      );
      logger.info('Created demo user', { email });
    }

    // 2. Clean previous sample document
    await query('DELETE FROM documents WHERE user_id = $1 AND title = $2', [user.id, 'ACME_IT_Security_Policy.md']);

    // 3. Register document
    const [doc] = await query(
      `INSERT INTO documents (user_id, title, file_name, file_type, file_size_bytes, status)
       VALUES ($1, $2, $3, $4, $5, 'processed') RETURNING id`,
      [user.id, 'ACME_IT_Security_Policy.md', 'ACME_IT_Security_Policy.md', 'text/markdown', Buffer.byteLength(SAMPLE_DOCUMENT)]
    );

    // 4. Chunk & Embed
    const chunks = ChunkingService.chunkDocument([{ pageNumber: 1, text: SAMPLE_DOCUMENT }]);
    logger.info(`Generated ${chunks.length} chunks. Generating embeddings...`);
    
    const embeddings = await EmbeddingService.generateEmbeddings(chunks.map((c) => c.content));
    
    await VectorStoreService.storeChunks(doc.id, chunks, embeddings);

    logger.info('Seeding finished successfully! You can now log in with:');
    logger.info(`Email: ${email} | Password: ${password}`);
  } catch (error: any) {
    logger.error('Seeding failed', { error: error.message });
  } finally {
    await pool.end();
  }
}

seed();
