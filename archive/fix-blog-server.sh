#!/bin/bash

# Fix Blog Page on DigitalOcean Server
echo "🔧 Fixing blog page on server..."

# Navigate to application directory
cd /opt/bridalteam

# Backup current files
cp website/routes/web.php website/routes/web.php.backup
cp website/app/Http/Controllers/PageController.php website/app/Http/Controllers/PageController.php.backup

# Update routes file with blog route
cat > website/routes/web.php << 'EOF'
<?php

Route::get('/', 'PageController@showHomePage');

// Debug route
Route::get('/debug-route', function() {
    return 'Laravel routing is working!';
});

Route::get('/vendor/login', 'PageController@showVendorLogin');
Route::get('/vendor/register', 'PageController@showVendorRegistration');
Route::get('/email-verify', 'PageController@showVerification');
Route::get('/logout', 'PageController@logoutRedirect');

Route::group(['middleware' => 'vendortoken'], function(){
    Route::get('/vendor/account', 'PageController@showVendorAccount');
    Route::get('/vendor/firstrun', 'PageController@showVendorFirstRun');
});

Route::get('/vendors', 'PageController@showVendorCategories');
Route::get('/vendors/{category}', 'PageController@showVendorCategory');
Route::get('/vendor/{slug}', 'PageController@showVendorPage');
Route::get('/gallery', 'PageController@showGalleryPage');

// Blog route - FIXES THE 404 ERROR
Route::get('/blog', 'PageController@showBlogPage');

// Health check
Route::get('/healthz', function(){ return 'ok'; });

// Catch-all route for custom pages (must be last)
Route::get('/{slug}', 'PageController@getPage')->where(['slug' => '^(?!vendor|api|admin|blog).*']);
EOF

# Check if showBlogPage method exists in PageController
if ! grep -q "showBlogPage" website/app/Http/Controllers/PageController.php; then
    echo "Adding showBlogPage method..."
    
    # Add the showBlogPage method before the closing brace
    sed -i '/^}$/i\\n    public function showBlogPage(){\n        // Dedicated blog page method\n        return view('\''blog'\'', [\n            '\''page'\'' => (object) [\n                '\''title'\'' => '\''Wedding Blog'\'',\n                '\''content'\'' => '\''Wedding planning tips and inspiration coming soon!'\''\n            ]\n        ]);\n    }' website/app/Http/Controllers/PageController.php
else
    echo "showBlogPage method already exists."
fi

# Clear all Laravel caches properly
echo "Clearing Laravel caches..."
docker-compose exec app bash -c "cd /var/www/html/website && php artisan route:clear"
docker-compose exec app bash -c "cd /var/www/html/website && php artisan config:clear"
docker-compose exec app bash -c "cd /var/www/html/website && php artisan view:clear"

# Restart application
echo "Restarting application..."
docker-compose restart app

# Wait for restart
echo "Waiting for application to start..."
sleep 20

# Test the blog page
echo "Testing blog page..."
curl -s http://localhost/blog | head -5

echo "✅ Blog fix complete!"
echo "Test in browser: http://159.203.137.176/blog"
EOF
