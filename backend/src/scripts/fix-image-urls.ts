import { config } from "dotenv";
import { resolve } from "path";
import pg from "pg";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.API_URL || "http://localhost:9000";
const databaseUrl = process.env.DATABASE_URL;

async function fixImageUrls() {
  console.log(`🔄 Starting image URL migration...`);
  console.log(`📍 API URL: ${apiUrl}`);
  console.log(`📍 Database: ${databaseUrl?.split("/").pop()}`);
  console.log("");

  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Get all images with relative URLs
    const relativeResult = await client.query(`
      SELECT id, url FROM image 
      WHERE url LIKE '/uploads/%' 
      AND url NOT LIKE 'http%'
    `);

    console.log(`📊 Found ${relativeResult.rows.length} images with relative URLs`);

    for (const image of relativeResult.rows) {
      const newUrl = `${apiUrl}${image.url}`;
      await client.query(`
        UPDATE image SET url = $1 WHERE id = $2
      `, [newUrl, image.id]);

      console.log(`  ✅ ${image.url} → ${newUrl}`);
    }

    // Get images pointing to localhost:3000
    const wrongResult = await client.query(`
      SELECT id, url FROM image 
      WHERE url LIKE '%localhost:3000%'
    `);

    console.log(`\n📊 Found ${wrongResult.rows.length} images pointing to localhost:3000`);

    for (const image of wrongResult.rows) {
      const newUrl = image.url.replace(/http:\/\/localhost:3000/, apiUrl);
      await client.query(`
        UPDATE image SET url = $1 WHERE id = $2
      `, [newUrl, image.id]);

      console.log(`  ✅ ${image.url} → ${newUrl}`);
    }

    // Show summary
    const summary = await client.query(`
      SELECT COUNT(*) as total FROM image;
    `);

    console.log(`\n✨ Migration complete! Total images: ${summary.rows[0].total}`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixImageUrls();

