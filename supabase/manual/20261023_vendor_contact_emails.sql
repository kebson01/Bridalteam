-- Vendor contact emails: high confidence (221 addresses)
--
-- Generated 2026-10-23 from VENDOR-PROSPECTS.md by the find-vendor-emails
-- skill. Run it by hand in the Supabase SQL editor (service role). It is not a
-- migration and nothing applies it automatically.
--
-- What it does: sets vendor_claims.contact_email for listings that are still
-- UNCLAIMED and have NO contact_email yet. It never overwrites an address
-- attached on /admin/claims, and it touches nothing once a listing is claimed.
--
-- Why this column matters: claim_listing_by_email() lets a confirmed account
-- on this address claim the listing (20261006210000_claim_listing_by_email.sql).
-- That is right for the business's own inbox, which is why only addresses the
-- business publishes itself are in here.
--
-- Matching: by exact business_name, and by the last 10 phone digits when the
-- file has a phone. A name that matches more than one listing is skipped and
-- reported, never guessed. Safe to run twice.

begin;

create temp table found_emails (business_name text, phone10 text, email text) on commit drop;

insert into found_emails (business_name, phone10, email) values
  ('Little''s Photography', '9545630444', 'info@littlesphotography.com'),
  ('Michael Murphy Photographic Imaging', '8775648555', 'michael@michaelmurphy.com'),
  ('Alizee Pechmajou Photography', '', 'alizeepechmajouphoto@gmail.com'),
  ('Topflash Photography & Studio', '', 'booktopflashphotography@gmail.com'),
  ('What A Natural Photography', '', 'whatanatural.cmdv@gmail.com'),
  ('Starfish Studios Photography and Films', '', 'hello@starfishstudiosfl.com'),
  ('Victoria Machin Photography', '', 'victoria@victoriamachinphotography.com'),
  ('Michelle VanTine Photography', '', 'contact@michellevantinephotography.com'),
  ('Ramoneda Photo', '', 'info@ramonedaphoto.com'),
  ('Care Studios', '3053602636', 'info@careweddings.com'),
  ('Lenisse Komatsu Photography', '', 'hello@lenisse.com'),
  ('Wanderlust Studios', '', 'wanderluststudiosfl@gmail.com'),
  ('Melanie Anne Photography', '', 'hello@melanieannephotography.com'),
  ('La Vie Studios', '', 'smile@laviestudios.com'),
  ('EP Photos', '', 'erica@epphotos.studio'),
  ('Kolour Haus', '', 'info@kolourhaus.com'),
  ('Jessica Vilchez Photo', '', 'hello@jessicavilchez.com'),
  ('LeFever Photo', '', 'info@lefeverphoto.net'),
  ('Boogietek Photo+Cinema', '', 'info@boogietek.com'),
  ('Mark Salner Photography', '', 'mark@marksalnerphotography.com'),
  ('Kenneth Appelbaum Photography', '', 'kaaphoto@icloud.com'),
  ('PRIMEUS Photography & Video', '', 'primeus.contact@gmail.com'),
  ('Videography by Cristina', '', 'cristina_godshall@hotmail.com'),
  ('Bells & Whistles Photography + Videography', '', 'info@bellswhistlesphoto.com'),
  ('Skyview Motions', '', 'fly@skyviewmotions.com'),
  ('Andreo Studio', '', 'info@andreostudio.com'),
  ('Megaset Weddings', '', 'megasetphotography@gmail.com'),
  ('Quality Media FL', '', 'qualitymediafl@gmail.com'),
  ('Until Forever Photography', '', 'untilforeverfilms@gmail.com'),
  ('Rimas Films', '', 'rimasfilms@gmail.com'),
  ('Concept Flowers', '3053004758', 'info@conceptflowers.com'),
  ('Jose Graterol Designs', '3057880562', 'josegrateroldesigns@gmail.com'),
  ('Petal Productions', '', 'info@petalproductions.com'),
  ('La Feterie by Juliana Schiffer', '', 'juliana@lafeterie.com'),
  ('Maison la Fleur', '', 'info@maisonlafleur.com'),
  ('Kish Events & Decor', '', 'info@kishevent.com'),
  ('Two Gardenias by Mary', '', 'info@twogardeniasbymary.com'),
  ('Creative Florals', '', 'creativefloralsfl@aol.com'),
  ('Heirloom Rosie', '', 'hello@heirloomrosie.com'),
  ('Wildflowers of Parkland', '9547526999', 'info@wildflowersofparkland.com'),
  ('Orange Blossoms Florals and Event Styling', '5615680528', 'events@orangeblossomsflorals.com'),
  ('Wellington Florist', '5613334441', 'service@wellingtonflorist.com'),
  ('Beldens Florist', '5618322871', 'beldensflorist01@bellsouth.net'),
  ('Flowers by J&J', '3057435459', 'danielle@keysflowers.com'),
  ('Kutchey''s Flowers', '3052928181', 'kutcheysflowersinkw@gmail.com'),
  ('Saucha Floral Design', '', 'info@sauchafloraldesign.com'),
  ('Coco and Jojo Florals', '', 'hello@cocoandjojoflorals.com'),
  ('Victoria Park Flower Studio', '', 'victoriaparkflowerstudio@gmail.com'),
  ('La Fleur Florals & Events', '', 'lafleurflorals@gmail.com'),
  ('Art of Petals', '', 'artofpetals954@gmail.com'),
  ('Aura Design Flowers', '', 'info@auradesignflowers.com'),
  ('Neroli Blume', '', 'info@neroliblume.com'),
  ('The Sweet House Bakery', '', 'thesweethousebakeryfl@gmail.com'),
  ('Sweet Guilt by Angelica', '', 'info@sweetguilt.com'),
  ('Gallery of Cakes', '', 'gocakes@yahoo.com'),
  ('Chefness Bakery', '', 'info@chefnessbakery.com'),
  ('Paula''s Bake Shop', '', 'info@paulasbakeshop.com'),
  ('LoveLee Bakeshop', '9547152050', 'hello@loveleebakeshop.com'),
  ('Panchis Bakery', '7546003370', 'panchisbakeries@gmail.com'),
  ('La Cake Cafe', '7547792965', 'lacakecafe@gmail.com'),
  ('Mood 4 Cakes', '', 'mood4cakes@gmail.com'),
  ('Elegant Temptations', '', 'etcakes@me.com'),
  ('The Mix DJs', '', 'dj@themixdjs.com'),
  ('Event Factor', '', 'info@theeventfactor.com'),
  ('DJ AJ Falcon', '', 'djajfalcon@gmail.com'),
  ('Masso Entertainment', '', 'matt@massoentertainment.com'),
  ('Vivid Source Events', '', 'vividsourceevents@gmail.com'),
  ('AAMusicians', '', 'alan@aamusicians.com'),
  ('La Nota Band', '', 'info@lanotaband.com'),
  ('Mariachi los Mensajeros', '', 'mariachilosmensajeroseljr@gmail.com'),
  ('Hermanos Mora Arriaga', '', 'info@hermanosmoraarriaga.com'),
  ('Kenny Quintero Y Su Orquesta Brava', '', 'orquestabrava@aol.com'),
  ('CK Entertainment', '9544361230', 'info@ckentertainmentinc.com'),
  ('Private Property Band', '', 'info@privatepropertyband.com'),
  ('Haviv Entertainment', '', 'haviventertainment@gmail.com'),
  ('Marry Me Mendez', '3054395553', 'chris@marrymemendez.com'),
  ('Eltard "Elta" Alexis', '', 'eltardsengagements@gmail.com'),
  ('The Vow Experience', '', 'info@thevowexperience.com'),
  ('Weddings by Lowell', '', 'weddingsbylowell@gmail.com'),
  ('From Engaged To Married', '', 'hello@fromengagedtomarried.com'),
  ('South Florida Wedding Officiant & Notary', '', 'southflweddingofficiant@gmail.com'),
  ('Just UnI Weddings', '', 'emwise@justuniwedding.com'),
  ('Divine Beauty Artists', '', 'info@divinebeautyartists.com'),
  ('Kiss This Makeup', '', 'info@kissthismakeup.com'),
  ('Aimee Beauty Co', '', 'info@aimeebeautyco.com'),
  ('Beauty Arquitek', '', 'info@beautyarquitek.com'),
  ('Wondrous Look', '3058904778', 'info@wondrouslook.com'),
  ('Beauty Studio', '', 'contact@beautystudioinc.com'),
  ('Art of Hair by Claudia', '', 'claudia@artofhairbyclaudia.com'),
  ('Nova MakeUp and Hair', '', 'supernovabeautyglobal@gmail.com'),
  ('Robbin Junnola Beauty', '', 'info@robbinjunnolabeauty.com'),
  ('Faces by April', '', 'facesbyapril@gmail.com'),
  ('Jules Fleming Artistry', '', 'info@julesflemingartistry.com'),
  ('Courtney Christopherson Glamour Group', '5612892138', 'courtneychristopherson@gmail.com'),
  ('Stephanie Verrmar', '', 'team@stephanieverrmar.com'),
  ('Gina Marie Weddings & Events', '', 'gina@ginamarieevents.com'),
  ('Memories for You, Weddings and Events', '', 'info@memoriesforyouevents.com'),
  ('Events by Tahimy', '', 'contact@tahimy.com'),
  ('BOLD Impact Events & Wedding Planners', '5613201517', 'info@boldimpactevents.com'),
  ('Olive & Ivory Events', '5616133456', 'christine@oliveandivoryevents.com'),
  ('Suhaag Garden', '', 'events@suhaaggarden.com'),
  ('Weddings To Go Key West', '3058792795', 'weddingstogokw@gmail.com'),
  ('Little Miss Planner', '7863340124', 'info@littlemissplannerkw.com'),
  ('Family Affair Key West', '3054330700', 'info@familyaffairkeywest.com'),
  ('Ocean Breeze Weddingz', '3059027688', 'info@weddingplanningfl.com'),
  ('Big Day in Key West', '3056479262', 'bigdayinkeywest@gmail.com'),
  ('Blue Orchid Events & Design', '2488404204', 'abby@blue-orchid-events.com'),
  ('A. Marie Events & Design', '3212058326', 'info@amarieevents.us'),
  ('AM Event Co.', '9545887869', 'info@ameventco.com'),
  ('Fabuluxe Events', '5612542041', 'jennifer@fabuluxeevents.com'),
  ('Ramos Events', '', 'hello@ramosevents.com'),
  ('Urbanica Luxury Events', '', 'hello@urbanicaevents.com'),
  ('Rodriguez Event Design', '', 'rodriguezeventdesign@gmail.com'),
  ('Bill Hansen Catering', '3058586660', 'info@billhansencatering.com'),
  ('Thierry Isambert Culinary & Event Design', '3056356626', 'info@thierryisambert.com'),
  ('Miami Wedding Caterer', '3056695221', 'les@miamiweddingcaterer.net'),
  ('Chef''s Delights Catering', '7862876283', 'info@chefsdelights.com'),
  ('VNV Events', '', 'info@vnvevents.com'),
  ('Premier Event Catering', '', 'info@eatwithpremier.com'),
  ('Sensory Delights', '9543948465', 'info@sensorydelights.net'),
  ('Dade County Food Group', '3059657764', 'dadecountyfoodgroup@gmail.com'),
  ('Another Perfect Party', '', 'contactus@anotherperfectparty.com'),
  ('Hugh''s Catering', '9545634844', 'info@hughscatering.com'),
  ('Catering by Kerrisha', '', 'kerrisha@cateringbykerrisha.com'),
  ('Eggwhites Catering', '3058922066', 'events@eggwhitescatering.com'),
  ('Elegant Kosher Catering & Events', '', 'info@elegantkoshercatering.com'),
  ('Shaike''s Kosher Catering', '', 'info@shaikes.com'),
  ('Kosher From Z Heart', '', 'kosherzohara@gmail.com'),
  ('The Soundpost Venue', '', 'info@soundpostvenue.com'),
  ('Barn 305', '', 'info@thebarn305.com'),
  ('Aqua Reception Hall', '', 'info@aquareception.com'),
  ('Prestige Estate', '7866121542', 'info@prestige-estate.com'),
  ('The Venue Fort Lauderdale', '9547656968', 'info@thevenueftlauderdale.com'),
  ('Crystal Ballroom BeachPlace', '', 'crystalballroombeachplace@gmail.com'),
  ('Broward Center for the Performing Arts', '', 'facilityrentals@browardcenter.org'),
  ('Villa Toscana Miami', '3059088586', 'hello@villa-toscana-miami.com'),
  ('SeaFair Miami', '7863534738', 'info@seafairyachts.com'),
  ('Vista Yachts', '3054072324', 'info@vistayachts.com'),
  ('Charter One Yachts', '9548334731', 'info@charter1now.com'),
  ('Trinity Episcopal Cathedral', '', 'office@trinitymiami.org'),
  ('Miami Beach Community Church', '', 'contactus@miamibeachcommunitychurch.com'),
  ('Coral Gables Congregational UCC', '', 'info@gablesucc.org'),
  ('The Ancient Spanish Monastery', '', 'info@spanishmonastery.com'),
  ('Miami Beach Botanical Garden', '', 'growwithus@mbgarden.org'),
  ('Historic Virginia Key Beach Park', '', 'info@virginiakeybeachpark.net'),
  ('Fort Lauderdale Historical Society', '', 'info@historyfortlauderdale.org'),
  ('Wine + Garden', '', 'events@wineandgarden.com'),
  ('LAVAN Luxury Venue', '', 'info@lavanvenue.com'),
  ('Club of Knights', '', 'sales@clubofknights.com'),
  ('Conrad Fort Lauderdale Beach', '', 'fllci.catering@conradhotels.com'),
  ('The Biltmore Hotel', '', 'cateringleads@biltmorehotel.com'),
  ('Rumbatours Miami', '', 'reservations@rumbatoursmiami.com'),
  ('A Family Limo', '', 'reservations@afamilylimo.com'),
  ('American Limo & Transportation Service', '', 'info@americanlimofl.com'),
  ('American Dream Tour Miami', '', 'info@americandreamtourmiami.com'),
  ('Miami White Trolley', '', 'reservations@rumbatoursmiami.com'),
  ('Molly''s Trolleys of West Palm Beach', '', 'info@mollystrolleys.com'),
  ('Atlantic Charters', '9544482032', 'sales@atlanticchartersinc.com'),
  ('Sal Limo Service', '7868163259', 'reservations@sallimoservice.com'),
  ('Lauderdale Limos', '9549512348', 'lauderdalelimousines@gmail.com'),
  ('Majestic Limousines', '3057740117', 'info@majesticlimos.com'),
  ('Ace Photobooth Rentals', '', 'sales@acephotoboothrentals.com'),
  ('Esteem 360 Studios', '', 'info@esteem360studios.com'),
  ('The Gala Photobooth', '', 'info@thegalaphotobooth.com'),
  ('MIA Mirror Booth', '', 'info@miamirrorbooth.com'),
  ('Photo Booth by LNH', '', 'info@photoboothlnh.com'),
  ('JuJu Booth', '', 'info@jujubooth.com'),
  ('Luv Bridal Fort Lauderdale', '', 'fortlauderdale@luvbridal.com'),
  ('Savvy Bridal FTL', '', 'ftl@savvybridal.com'),
  ('Talega Atelier', '', 'info@talegaatelier.com'),
  ('Gloria Couture', '3058641090', 'info@gloriacouture.com'),
  ('LinDi Bridal', '', 'lindiandco@gmail.com'),
  ('Mi Vintage', '', 'letsparty@mivintagerentals.com'),
  ('Arc Divine', '9543196126', 'weddings@arcdivine.com'),
  ('Arches By Design', '', 'info@archesbydesign.com'),
  ('Eventgi Party Rental', '', 'info@eventgipartyrental.com'),
  ('Allure Party Rentals', '9545989595', 'info@allurepartyrentals.com'),
  ('Christina''s Party Rentals', '', 'cpr.christina@gmail.com'),
  ('Weston Events Party Rentals', '', 'info@weston-events.com'),
  ('Imperial Event Rentals', '', 'info@imperialeventrentals.com'),
  ('Fire Water Bars', '', 'alan@firewaterbars.com'),
  ('Cocktail Couture Mobile', '', 'shannon@cocktailcouturemobile.com'),
  ('The Elegant Harp', '', 'esther@elegantharp.net'),
  ('Serenade Events', '', 'info@serenadeevents.com'),
  ('Lettered with Love', '', 'janice@letteredwithlove.com'),
  ('Carla Hagan Calligraphy and Design', '', 'info@carlahagandesigns.com'),
  ('Fort Lauderdale Invitations', '', 'ftlinvitations@aol.com'),
  ('Tuesday Grace Designs', '', 'chelsea@tuesdaygracedesigns.com'),
  ('Paper & Lace', '', 'hello@paperandlaceboutique.com'),
  ('Invites and Events', '', 'jasmeet@invitesandevents.com'),
  ('Lucky Tusk', '', 'hello@luckytusk.com'),
  ('GelatoGo', '7864500477', 'alessandro@gelatogo.net'),
  ('The Gelato Bar', '', 'hello@urbanicaevents.com'),
  ('I Scream Gelato', '', 'inquiry@iscream-gelato.com'),
  ('HipPOPs', '', 'info@hippops.com'),
  ('Banana Daddy', '', 'info@eatbananadaddy.com'),
  ('AJ''s Coffee Break', '', 'info@ajscoffeebreak.com'),
  ('Kirk Jewelers', '3053711321', 'inquiry@kirkjewelers.com'),
  ('Jae''s Jewelers', '3054437724', 'info@jaesjewelers.com'),
  ('DreamARK Events', '', 'info@dreamarkevents.com'),
  ('Marina Mella Tailoring', '', 'marimellatailoring@gmail.com'),
  ('Needlestitch', '', 'info@needlestitch.net'),
  ('The Hora Loca Guys', '', 'thehoralocaguys@gmail.com'),
  ('ArteVivo Dance Studio', '', 'artevivods@gmail.com'),
  ('Miami Superhero', '', 'miamisuperhero@hotmail.com'),
  ('Coastal Mobile Restrooms', '', 'cmrtrentals@gmail.com'),
  ('Island Restrooms', '', 'service@islandrestrooms.com'),
  ('Bailey''s Luxury Travel', '', 'baileysluxurytravel@gmail.com'),
  ('Cruise Planners - Christine Erwin', '', 'christine.erwin@cruiseplanners.com'),
  ('Travelmation', '', 'info@travelmation.net'),
  ('Ziva Staffing', '', 'info@zivastaffing.com'),
  ('Farber Parking', '', 'info@farberparking.com'),
  ('AV Valet Parking Miami', '', 'mfajardo@avvparking.com'),
  ('FSO Guard', '', 'info@fsoguard.us'),
  ('Mia Sound Production', '', 'info@miasoundproduction.com'),
  ('Master Sound Productions', '', 'lazaro@mastersoundpro.com'),
  ('Monster Sound Productions', '', 'info@monstersoundpro.com'),
  ('SoFlo Studio', '', 'info@soflostudio.com'),
  ('Firepower Displays', '3052588820', 'info@firepowerdisplays.com'),
  ('My 3 Sons Fireworks', '5612105176', 'josh@3sonspyro.com'),
  ('Add Fire', '', 'bill@addfire.com');

create temp table matched on commit drop as
select f.*, p.org_id,
       count(*) over (partition by f.business_name, f.phone10) as n
  from found_emails f
  join public.vendor_profiles p
    on p.business_name = f.business_name
   and (f.phone10 = '' or right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = f.phone10);

-- Not found in vendor_profiles (name or phone differs from the file):
select f.business_name, f.email from found_emails f
 where not exists (select 1 from matched m where m.business_name = f.business_name and m.phone10 = f.phone10);

-- Ambiguous (same name and phone on more than one listing), skipped:
select business_name, email, n from matched where n > 1;

update public.vendor_claims c
   set contact_email = m.email
  from matched m
 where m.n = 1
   and c.org_id = m.org_id
   and c.claimed_at is null
   and c.contact_email is null;

-- How many listings now carry one of these addresses:
select count(*) as listings_with_found_email
  from public.vendor_claims c join matched m on m.org_id = c.org_id
 where lower(btrim(c.contact_email)) = m.email;

-- Change to ROLLBACK for a dry run that only prints the reports above.
commit;
