-- Vendor contact emails: TO VERIFY FIRST (170 addresses)
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
-- !! These addresses have a caveat in VENDOR-PROSPECTS.md: an old source, two
-- !! sources that disagree, a listing-only source, or a business that may be
-- !! closed or outside South Florida. Check each row's Outcome note and delete
-- !! the lines you are not sure of BEFORE running. A wrong address here lets
-- !! the wrong person claim that vendor's listing.
--
-- Matching: by exact business_name, and by the last 10 phone digits when the
-- file has a phone. A name that matches more than one listing is skipped and
-- reported, never guessed. Safe to run twice.

begin;

create temp table found_emails (business_name text, phone10 text, email text) on commit drop;

insert into found_emails (business_name, phone10, email) values
  ('Rey Zamora Photography', '', 'reyzamora0112@gmail.com'),
  ('Marcelin Photography', '', 'sandra@marcelinphotography.com'),
  ('Supanik Photography', '7863851100', 'bruce@supanikphotography.com'),
  ('Robi Studio', '', 'info@robistudio.com'),
  ('Alfaaz Photography', '', 'info@alfaazphotography.com'),
  ('Infinite Loop Photography', '', 'info@infiniteloopphoto.com'),
  ('Maloman Boutique Photography', '', 'info@malomanstudios.com'),
  ('Haring Photography', '', 'info@haringphotography.com'),
  ('Lukas G Photography', '5612462403', 'photography@lukasg.com'),
  ('Photography South Florida', '5619518800', 'info@photographysouthflorida.com'),
  ('Clickety Chicks', '5616620455', 'kim@kimfontaine.com'),
  ('Alan Luby Photography', '5615779246', 'aluby1441@aol.com'),
  ('Chris Joriann Photography', '5612469271', 'info@chrisjoriann.com'),
  ('Jannette De Llanos Photography', '', 'jannettedellanosweddings@yahoo.com'),
  ('Barbara Knowles Wedding Photography', '', 'iweddu@bellsouth.net'),
  ('Michelle Elyse Photography', '', 'info@michelleelysephotography.com'),
  ('Poirier Wedding Photography', '', 'poirierphotography@yahoo.com'),
  ('Andrea Harborne Photography', '', 'andreaharbornephotography@gmail.com'),
  ('Candid Studios', '8445226343', 'support@candidstudios.net'),
  ('VM Productions', '3052399555', 'vmpfilm@aol.com'),
  ('Shutter & Sound', '8008413990', 'hello@shutterandsound.com'),
  ('Global Filmz', '8886532688', 'info@globalfilmz.com'),
  ('South Florida Wedding Studio', '9547782267', 'daniel@miamiweddingstudio.com'),
  ('Beautiful Kreations', '9549337530', 'marcia@beautifulkreations.com'),
  ('Mint Floral Studio', '', 'mintfloralstudio@gmail.com'),
  ('J & J Flowers and Gift Shop', '', 'jjflowers016@gmail.com'),
  ('Twice the Style', '5619399589', 'twicethestyle@yahoo.com'),
  ('Xquisite Events Production', '5619889798', 'designassistant@xefla.com'),
  ('Key Largo Flowers & Gifts', '3054513702', 'keylargoflowersandgifts@gmail.com'),
  ('Island Blooms', '3053043504', 'lori@islandblooms.com'),
  ('Milan Event Floral & Decor', '3057354749', 'milanevent@gmail.com'),
  ('Bayfront Floral & Event Design', '9549811024', 'info@bayfrontfloral.com'),
  ('A Marc In Design', '', 'amarcindesign2022@gmail.com'),
  ('Fort Lauderdale Florist', '', 'wecare@dgmflowers.com'),
  ('Luxury Flowers Miami', '', 'luxuryflorist@icloud.com'),
  ('Nerys Flowers', '', 'info@nerysflowers.com'),
  ('Fleur de Marsca', '', 'info@fleurdemarsca.com'),
  ('Chef Marian', '', 'info@chefmariandesserts.com'),
  ('SugarChef', '', 'sugar@sugarchef.com'),
  ('Ossi''s Bake Shop', '', 'ossisbakeshop@gmail.com'),
  ('We Take The Cake', '9547642253', 'sales@wetakethecake.com'),
  ('Johnson''s Custom Cakes', '', 'info@johnsonscustomcakes.com'),
  ('Marvelous Entertainment', '', 'musicmarvelous@gmail.com'),
  ('LIVE305 Entertainment', '', 'info@live305entertainment.com'),
  ('Palm Beach Party DJ', '5612852640', 'info@palmbeachpartydj.com'),
  ('DJ Javier Cabal & Event Services', '7867080848', 'djjaviercabal@gmail.com'),
  ('Zeta Event Productions', '9547321350', 'info@zetaeventproductions.com'),
  ('Rhythm City Productions', '', 'info@rhythmcityweb.com'),
  ('Xpress Entertainment', '', 'events@xpressdjs.com'),
  ('Edifying Beats', '', 'info@edifyingbeats.com'),
  ('Deco DJs', '', 'ernie@lightfxpros.com'),
  ('Power Parties', '', 'bigwill@powerparties.com'),
  ('NYX Events', '', 'info@nyxevents.com'),
  ('FM Band Miami', '', 'moralmusicinc@gmail.com'),
  ('Bay Kings Band', '', 'info@baykingsband.com'),
  ('Shane Duncan Band', '', 'info@shaneduncanmusic.com'),
  ('Inner Music Management', '', 'info@innermusiclive.com'),
  ('Florida Music Group', '7729249302', 'info@floridamusicgroup.com'),
  ('The Sparkle Band', '', 'hello@thesparkleband.com'),
  ('Louis Pettinelli Entertainment', '', 'louis@louispettinellientertainment.com'),
  ('Mariachi Fiesta Grande', '', 'infofiestagrande@gmail.com'),
  ('Mariachi Mexico 88', '', 'mariachimexico88@aol.com'),
  ('Fondo Blanco Band', '', 'info@fondoblanco.net'),
  ('Sekond Nature', '9546078334', 'juan@sekondnature.com'),
  ('Heatwave Band', '', 'arthw@bellsouth.net'),
  ('Cantor Ellen Stettner', '5612131277', 'elstet33@gmail.com'),
  ('Florida Weddings by Cecilia', '5612310043', 'weddingsbycecilia@gmail.com'),
  ('Gracefully Wed Events', '5615327919', 'gracefullywedevents@gmail.com'),
  ('The Officiant FLA (Judge Rob)', '', 'ftlrobby@gmail.com'),
  ('HeartsFlow', '', 'info@heartsflow.org'),
  ('Rabbi-Cantor Gaston Bogomolni', '', 'info@tzimtzum33.org'),
  ('Wedding Ceremonies by Ketty Urbay', '', 'revketty@gmail.com'),
  ('All Faith Ministry', '', 'info@allfaithministry.com'),
  ('Wedding Officiant Fort Lauderdale', '9542406234', 'bblakene@bellsouth.net'),
  ('Marry Me, LLC', '', 'marrymellc@aol.com'),
  ('Tashy Marie Beauty', '', 'hello@tashymariebeauty.com'),
  ('Not Just Blonde Studio (Alissa Westcott)', '', 'korubeauty@outlook.com'),
  ('The Changing Room', '', 'thechangingroomfd@bellsouth.net'),
  ('Mari D. MUA', '', 'info@maridmua.com'),
  ('Hans on Beauty', '9546679940', 'tricia.hans@hansonbeauty.com'),
  ('PriscillaM Beauty', '', 'priscillambeautyinquiry@gmail.com'),
  ('Glam By Carmen', '', 'info@glambycarmen.info'),
  ('Luxy Events', '', 'luxyeventplanning@gmail.com'),
  ('Oh My Occasions', '', 'plan@ohmyoccasions.com'),
  ('My Italian Favors', '8662361695', 'info@myitalianfavors.com'),
  ('Events by Mala', '', 'info@malaevents.com'),
  ('Eventsource', '', 'customerservice@eventsource.com'),
  ('JRN Events', '', 'jrneventdecors@gmail.com'),
  ('Vidal Wedding & Event Planner', '3059421604', 'vidalofkeywest@gmail.com'),
  ('Say Yes In Key West', '3053967602', 'surpriseinparadise@gmail.com'),
  ('Key West Casual Weddings', '3058491179', 'dan@keywestcasualweddings.com'),
  ('Florida Weddings', '', 'daylen@floridaweddings.com'),
  ('Event Bliss Design', '9544639120', 'info@eventblissdesign.com'),
  ('Catering By Lovables', '3056401921', 'info@lovablescatering.com'),
  ('Broward Catering', '9549836937', 'sales@browardcatering.com'),
  ('Florida Cater', '', 'info@floridacater.com'),
  ('Eden Catering', '', 'events@cateringeden.com'),
  ('Culinary Artz Catering', '9548038818', 'info@floridacater.com'),
  ('The Club at Weston Hills', '', 'sales@theclubatwestonhills.com'),
  ('The Addison', '5613720568', 'specialevents@theaddison.com'),
  ('Villa Casa Casuarina', '7864852200', 'events@vmmiamibeach.com'),
  ('Vizcaya Museum & Gardens', '3056158735', 'facility.rentals@vizcaya.org'),
  ('Boat Miami', '3057582500', 'charters@boatmiami.com'),
  ('Miami Yacht Connect', '3058130537', 'info@miamiyachtconnect.com'),
  ('Island Queen Cruises', '3053795119', 'islandqueen@islandqueencruises.com'),
  ('Beth David Congregation', '3058543911', 'info@bethdavidmiami.org'),
  ('Atlantic Wedding Chapel', '9544615520', 'atlanticweddingchapel@gmail.com'),
  ('Stonebridge Country Club', '', 'info@stonebridgefl.com'),
  ('Boca Lago Golf & Country Club', '', 'jen.marden@bocalago.com'),
  ('Boca Dunes Golf & Country Club', '', 'cateringdirector@bocadunes.com'),
  ('The Club at Boca Pointe', '', 'fbalan@heritagegolfgroup.com'),
  ('Plantation Preserve Golf Course & Club', '', 'membership@plantation.org'),
  ('The Grateful Palate Catering & Events', '', 'info@gratefulpalate.com'),
  ('Comber Hall', '', 'afancyfiesta@msn.com'),
  ('Fort Lauderdale Airport Shuttle Limo', '9546887738', 'info@airportshuttleinc.com'),
  ('Apex International Transportation', '3057075837', 'maps@apexlimofl.com'),
  ('Worldwide Limo', '3054401111', 'info@worldwidelimo.com'),
  ('Rent For Event', '8774096999', 'contact@rentforevent.com'),
  ('DJ Peoples', '3053289492', 'rentals@djpeoples.com'),
  ('ANV Bridal Valet', '', 'anvbridalvalet@yahoo.com'),
  ('Boca Raton Bridal', '5614476541', 'gowns@bocaratonbridal.com'),
  ('Amazing Brides Couture', '5613729377', 'amazingbridescouture@gmail.com'),
  ('Wonderland Bridal', '9549738695', 'hello@wonderlandbridal.com'),
  ('Patricia South''s Bridal & Formal', '', 'info@psbride.com'),
  ('Lauderdale Bride', '', 'info@lauderdalebride.com'),
  ('AJs Custom Suits & Tuxedos Rentals', '', 'info@thefirmsuits.com'),
  ('MDO Miami', '', 'manuel@mdomiami.com'),
  ('Eventluxe Rentals', '', 'info@eventluxe.com'),
  ('Elements and Access Event Rentals', '', 'sales@elementsandaccents.com'),
  ('Over the Top Rental Linens', '', 'info@ottrl.com'),
  ('With A Twist Bartending Service', '', 'info@withatwistevents.com'),
  ('Craft Bar Co.', '', 'info@craft-barco.com'),
  ('Mr Barrtenderr', '', 'info@mrbarrtenderr.com'),
  ('Jade Strings', '', 'info@jadestrings.com'),
  ('Manhattan Music', '', 'info@manhattanmusic.com'),
  ('Calligraphy by Elaine', '', 'calligraphybye@aol.com'),
  ('Miami Writes Co', '', 'info@miamiwrites.com'),
  ('Kiki''s Customized Creations', '', 'kiki.ccreations@gmail.com'),
  ('Fajardo Elite Dance Academy', '', 'fajardoelitedance@gmail.com'),
  ('vON Dance', '', 'vondance@msn.com'),
  ('The Wedding Dance Studio', '', 'info@theweddingdancestudio.com'),
  ('Fred Astaire Dance Studios South Florida', '', 'delraybeach@fredastaire.com'),
  ('Glyk Gelato', '5616094900', 'info@glyk.com'),
  ('El Salvaje Food Trailer', '', 'elsalvajefoodtrailer@gmail.com'),
  ('Nemaro Jewelers', '3053584399', 'sales@nemarojewelers.com'),
  ('Fashion Balloons', '', 'info@fashion-balloons.com'),
  ('Drapeworks', '', 'sales@drapeworks.com'),
  ('Emma Couture & Alterations', '', 'emmasalterations@gmail.com'),
  ('Clothing Solutions', '', 'mrscindyduval@gmail.com'),
  ('B&P Alterations', '', 'bpalterations@gmail.com'),
  ('J&G Entertainment', '3056772429', 'info@jandgentertainment.com'),
  ('Led Robot Miami', '9545306136', 'info@ledrobotsmiami.com'),
  ('Blast Party Entertainment', '', 'info@blastpe.com'),
  ('The Party Characters', '', 'thepartycharacters@gmail.com'),
  ('Miami Cigar Entertainment', '8455498751', 'miamicigarentertainment@gmail.com'),
  ('Cigar Bella', '', 'katrina@cigarbella.com'),
  ('A Royal Flush', '', 'sales@aroyalflush.com'),
  ('Royal Restrooms Florida', '', 'service@royalrestroomsfl.com'),
  ('Grisel Velasco', '3052820809', 'travelagencylove2travel@gmail.com'),
  ('Karrah Kazravan', '8449502143', 'info@exploreeffortlessly.com'),
  ('Mario Lopez', '9543301210', 'hello@destinationweddingsexpert.com'),
  ('Carolyn Drummond', '3054325108', 'carolyn@dvcweddings.com'),
  ('Anchored South Travel Services', '', 'hello@anchoredsouth.com'),
  ('Luxevo Vacations', '', 'isabel@luxevovacations.com'),
  ('The Vacation Group', '', 'custserv@vacation.com'),
  ('Soflo Valet', '', 'joe@sofloparking.com'),
  ('717 Parking', '', 'support@717parking.com'),
  ('IGS Security', '', 'eyal@igssecurityusa.com'),
  ('Fireworks Over Miami', '3053050191', 'lutgardomp@gmail.com'),
  ('Pyro Pros Fireworks', '', 'pyroprosfl@gmail.com');

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
