#!/bin/bash
# Fix image URLs in database

API_URL="${API_URL:-http://localhost:9000}"

echo "🔄 Fixing image URLs in database..."
echo "📍 API URL: $API_URL"
echo ""

# Connect to database and fix URLs
PGPASSWORD=medusa psql -U medusa -d medusa_db -h localhost -p 5433 << EOF
-- Fix relative URLs (add API_URL prefix)
UPDATE image 
SET url = '${API_URL}' || url
WHERE url LIKE '/uploads/%' 
AND url NOT LIKE 'http%';

-- Fix wrong localhost:3000 URLs
UPDATE image 
SET url = replace(url, 'http://localhost:3000', '${API_URL}')
WHERE url LIKE '%localhost:3000%';

-- Show updated images
SELECT id, url FROM image WHERE url LIKE '%uploads%' LIMIT 10;

echo "✨ Image URL migration complete!"
EOF
