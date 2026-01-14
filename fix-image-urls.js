#!/usr/bin/env node
const { Client } = require('pg');

const apiUrl = process.env.API_URL || 'http://localhost:9000';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://medusa:medusa@localhost:5433/medusa_db';

async function fixImageUrls() {
  const client = new Client({ connectionString: databaseUrl });

  console.log('\n🔄 Fixing image URLs in database...');
  console.log(`📍 API URL: ${apiUrl}\n`);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if image table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'image'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Image table does not exist yet. No images to fix.');
      await client.end();
      return;
    }

    // Fix relative URLs
    console.log('1️⃣  Fixing relative URLs (/uploads/...)');
    const result1 = await client.query(`
      UPDATE image 
      SET url = $1 || url
      WHERE url LIKE '/uploads/%' 
      AND url NOT LIKE 'http%'
      AND url NOT LIKE $2
    `, [apiUrl, `%${apiUrl}%`]);

    if (result1.rowCount > 0) {
      console.log(`   ✅ Updated ${result1.rowCount} images\n`);
    } else {
      console.log(`   ℹ️  No relative URLs found\n`);
    }

    // Fix localhost:3000 URLs
    console.log('2️⃣  Fixing localhost:3000 URLs');
    const result2 = await client.query(`
      UPDATE image 
      SET url = REPLACE(url, 'http://localhost:3000', $1)
      WHERE url LIKE '%localhost:3000%'
    `, [apiUrl]);

    if (result2.rowCount > 0) {
      console.log(`   ✅ Updated ${result2.rowCount} images\n`);
    } else {
      console.log(`   ℹ️  No localhost:3000 URLs found\n`);
    }

    // Show statistics
    console.log('📊 Image URL statistics:');
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN url LIKE 'http://%' OR url LIKE 'https://%' THEN 1 ELSE 0 END) as absolute_urls,
        SUM(CASE WHEN url LIKE '/%' AND url NOT LIKE 'http:%' AND url NOT LIKE 'https:%' THEN 1 ELSE 0 END) as relative_urls
      FROM image
    `);

    const row = stats.rows[0];
    console.log(`   Total images: ${row.total}`);
    console.log(`   Absolute URLs (http/https): ${row.absolute_urls}`);
    console.log(`   Relative URLs (/...): ${row.relative_urls}\n`);

    // Show samples
    const sampleCheck = await client.query(`SELECT COUNT(*) FROM image`);
    if (sampleCheck.rows[0].count > 0) {
      console.log('📋 Sample image URLs:');
      const samples = await client.query(`SELECT url FROM image WHERE url LIKE '%uploads%' LIMIT 3`);
      for (const image of samples.rows) {
        console.log(`   ${image.url}`);
      }
      console.log();
    }

    console.log('✨ Migration complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixImageUrls();
