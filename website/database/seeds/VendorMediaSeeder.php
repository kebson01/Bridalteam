<?php

use Illuminate\Database\Seeder;

class VendorMediaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker\Factory::create();
        $placeholderimgcats = array("cats", "people", "city", "business", "fashion");

        for ($i=0; $i < 15; $i++) {
            $categoryid = rand(0, 15);
            $colorid = rand(0, 29);
            $themeid = rand(0, 19);
            $imagecat = $placeholderimgcats[rand(0, 4)];

            $keywords = $faker->words(4, false);
            $image = $faker->image('storage/app/public/media/6/', 600, 400, $imagecat, false);
            $imagethumb = $faker->image('storage/app/public/media/6/thumb', 320, 240, $imagecat, false);
            DB::table('vendor_media')->insert([
                'type' => 'image',
                'status' => 2,
                'keyword' => implode(',', $keywords),
                'category' => $categoryid,
                'color' => $colorid,
                'theme' => $themeid,
                'isproduct' => false,
                'product_link' => null,
                'vendor_id' => 6,
                'urlpath' => '/media/6/' . $image,
                'path' => 'public/media/6/'. $image,
                'thumbnailpath' => '/media/6/thumb/'. $imagethumb,
                'square_thumbnailpath' => '/media/6/thumb/'. $imagethumb,
                'order' => 0
            ]);
        }        
    }
}
