#!/usr/bin/env python3
import psycopg2
import sys
import os

# Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '5433'))
DB_NAME = os.getenv('DB_NAME', 'medusa_db')
DB_USER = os.getenv('DB_USER', 'medusa')
DB_PASS = os.getenv('DB_PASS', 'medusa')
API_URL = os.getenv('API_URL', 'http://localhost:9000')

print(f"🔄 Fixing image URLs in database...")
print(f"📍 Database: {DB_HOST}:{DB_PORT}/{DB_NAME}")
print(f"📍 API URL: {API_URL}")
print("")

try:
    # Connect to database
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    cur = conn.cursor()
    
    # Fix relative URLs
    print("1️⃣  Fixing relative URLs (/uploads/...)...")
    cur.execute("""
        UPDATE image 
        SET url = %s || url
        WHERE url LIKE '/uploads/%%' 
        AND url NOT LIKE 'http%%'
        AND url NOT LIKE %s
    """, (API_URL, f'%{API_URL}%'))
    
    updated = cur.rowcount
    print(f"   ✅ Updated {updated} images with relative URLs")
    
    # Fix localhost:3000 URLs
    print("2️⃣  Fixing localhost:3000 URLs...")
    cur.execute("""
        UPDATE image 
        SET url = REPLACE(url, 'http://localhost:3000', %s)
        WHERE url LIKE '%localhost:3000%'
    """, (API_URL,))
    
    updated = cur.rowcount
    print(f"   ✅ Updated {updated} images with localhost:3000")
    
    conn.commit()
    
    # Show stats
    print("\n📊 Image URL statistics:")
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN url LIKE 'http://%' THEN 1 ELSE 0 END) as absolute_urls,
            SUM(CASE WHEN url LIKE '/%' AND url NOT LIKE 'http:%' THEN 1 ELSE 0 END) as relative_urls
        FROM image
    """)
    
    stats = cur.fetchone()
    print(f"   Total images: {stats[0]}")
    print(f"   Absolute URLs (http://...): {stats[1]}")
    print(f"   Relative URLs (/...): {stats[2]}")
    
    # Show sample
    print("\n📋 Sample image URLs:")
    cur.execute("SELECT id, url FROM image WHERE url LIKE '%uploads%' LIMIT 3")
    for row in cur.fetchall():
        print(f"   {row[1]}")
    
    cur.close()
    conn.close()
    
    print("\n✨ Migration complete!")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    sys.exit(1)
