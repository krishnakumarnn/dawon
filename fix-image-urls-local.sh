#!/bin/bash

# Fix Image URLs in Local Database
# This script updates image URLs in the database to point to the correct API endpoint (port 9000)

echo "🔄 Fixing image URLs in local database..."
echo ""

API_URL="http://localhost:9000"
DB_USER="medusa"
DB_NAME="medusa_db"
DB_HOST="localhost"
DB_PORT="5433"

# Export password for non-interactive connection
export PGPASSWORD="medusa"

echo "📍 Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "📍 API URL: $API_URL"
echo ""

# Fix relative URLs - add API_URL prefix
echo "1️⃣  Fixing relative URLs (/uploads/...)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
"UPDATE image 
 SET url = '${API_URL}' || url
 WHERE url LIKE '/uploads/%' 
 AND url NOT LIKE 'http%'
 AND url NOT LIKE '%${API_URL}%';"

# Fix wrong localhost:3000 URLs  
echo "2️⃣  Fixing localhost:3000 URLs..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
"UPDATE image 
 SET url = REPLACE(url, 'http://localhost:3000', '${API_URL}')
 WHERE url LIKE '%localhost:3000%';"

# Show results
echo ""
echo "📊 Current image URLs in database:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
"SELECT COUNT(*) as total, 
        SUM(CASE WHEN url LIKE 'http://%' THEN 1 ELSE 0 END) as absolute_urls,
        SUM(CASE WHEN url LIKE '/%' AND url NOT LIKE 'http:%' THEN 1 ELSE 0 END) as relative_urls
 FROM image;"

echo ""
echo "Sample images:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
"SELECT url FROM image WHERE url LIKE '%uploads%' LIMIT 5;"

echo ""
echo "✨ Image URL migration complete!"
