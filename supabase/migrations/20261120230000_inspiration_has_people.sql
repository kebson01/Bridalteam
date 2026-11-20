-- Does an Inspiration photo show people? The homepage "Moments worth planning
-- for" mosaic only rotates in photos with has_people = false: the owner's rule
-- for the homepage is no recognisable faces (lib/home-moments.ts).
--
-- null means not checked yet, and keeps a photo off the homepage. Answers come
-- from lib/people-check.ts, written with the service role: as vendor uploads
-- are added (app/vendor/actions.ts), and daily for anything still unchecked
-- (app/api/cron/people-check). To overrule a wrong answer, set the column by
-- hand in the dashboard.

alter table public.inspiration_images
  add column if not exists has_people boolean;

comment on column public.inspiration_images.has_people is
  'Whether the photo shows any person. false = may rotate onto the homepage mosaic; null = not checked yet. Only the service role can set it (guard_inspiration_has_people).';

-- Vendors may insert and update their own rows (RLS), so without this a vendor
-- could mark their own photo people-free and put it on the homepage. Anyone
-- other than the service role (or a direct database session) has the value
-- ignored: null on insert, unchanged on update. Changing the image clears the
-- answer for everyone, since it was about the old picture.
create or replace function public.guard_inspiration_has_people()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if tg_op = 'INSERT' then
      new.has_people := null;
    else
      new.has_people := old.has_people;
    end if;
  end if;

  if tg_op = 'UPDATE'
     and new.image_url is distinct from old.image_url
     and new.has_people is not distinct from old.has_people then
    new.has_people := null;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_inspiration_has_people on public.inspiration_images;
create trigger guard_inspiration_has_people
  before insert or update on public.inspiration_images
  for each row execute function public.guard_inspiration_has_people();

-- The feed's photos as of 2026-11-20, each checked by eye.

-- No people in them.
update public.inspiration_images set has_people = false
where id in (select id from (values
  ('6bffbb99-0a08-4908-8db2-901ea916a780'::uuid), -- Enclosed Photo Booth
  ('c6dfec01-ea3b-4a19-bd98-2a6662bfc8a6'::uuid), -- Barrel Bar
  ('cd4066d7-8c9b-4b73-8d22-490e5fca1ec4'::uuid), -- Cocktail Menu
  ('d3d6ef6a-d58b-4cf2-9942-5524f12b662e'::uuid), -- Welcome Cocktail
  ('39cbf6a1-627b-4e33-8562-b312245ff983'::uuid), -- Crystal Ballroom Ceremony
  ('60a5b8d7-3cfc-46cf-bd93-4b3dec17f3f8'::uuid), -- Rings in crystal heels - St. Charles wedding, Boca Raton
  ('9d53447a-a435-42fb-b14b-dced91596f85'::uuid), -- Stonebridge Golf & Country Club - St. Charles wedding, Boca 
  ('6b07f017-2861-414a-a9fb-2cb0b9ada85a'::uuid), -- Invitations, rings and a vintage mirror
  ('475a6710-d38a-45bf-8c15-2617a98dad7a'::uuid), -- Calligraphy invitations with florals
  ('0b704bec-f1ca-465c-91d3-5111bb5fc651'::uuid), -- Invitation flat lay with bridal shoe
  ('f3fb4a94-7605-451d-b7a7-d8c76dfe9967'::uuid), -- White flowers and greenery cake
  ('84af3508-9602-4a61-95d3-1acc492291f2'::uuid), -- Five-tier cake with cascading flowers
  ('4feb2232-25fb-44d0-9baf-861cadd7c68d'::uuid), -- Ceremony under a large tree
  ('e92a92ff-9cdc-492f-a2ed-5c1a7466160f'::uuid), -- Beach aisle with chair decor
  ('ef003c8f-b55a-4619-95ee-4167ace9244d'::uuid), -- Floral garland and lanterns
  ('cc73b4e4-92c8-457c-92b2-d8120aded356'::uuid), -- Candlelit reception table
  ('98d52ffb-5096-4e7d-b0f7-a42e89cef861'::uuid), -- Gold cutlery place settings
  ('e960fc92-435b-4a5e-8730-fb1032dcedcb'::uuid), -- Orchids and roses bouquet
  ('58b75e21-1b55-4b5d-87b8-e8d516d78f2b'::uuid), -- Resort altar by the sea
  ('b6c4817d-6862-4e49-afea-db192c63a99c'::uuid), -- Gulf Coast beach ceremony
  ('39f3832e-d945-4533-99e7-981eb72b547b'::uuid), -- Wooden signs on the beach
  ('e7edaef5-000c-48ef-911f-aac7481f4c7d'::uuid), -- Beach neutrals
  ('e7ea278a-a39c-47f3-84c7-53a3872fdc61'::uuid), -- Greenhouse ceremony
  ('22b6a4c9-fb1b-4d77-9803-541037c39ca6'::uuid), -- Vineyard warmth
  ('5b9cb019-f1ff-4a0a-b466-158955bfe848'::uuid), -- Barn & candlelight
  ('443477f3-0433-4af4-8d62-2dbc17eb0a10'::uuid), -- Dried florals
  ('dbc739b2-7426-4719-bd74-1a42cdd8c585'::uuid), -- Grand & formal
  ('203925e1-d275-42f7-ac11-884bcae390f7'::uuid), -- Timeless elegance
  ('4c504ae2-0433-466c-864f-bf337c71d451'::uuid), -- Black-tie ballroom
  ('cd2d8061-bd94-4b6e-bfd0-9de09c87b317'::uuid), -- Free-spirited florals
  ('729b16bf-ed21-4c68-9995-ca7661da9026'::uuid), -- Macramé & pampas
  ('5f229c27-3220-461e-87cb-a9500cc7e08c'::uuid) -- Desert bohemian
) as v(id));

-- People in them.
update public.inspiration_images set has_people = true
where id in (select id from (values
  ('b0da2cf6-2f1c-40a7-be47-f929e97063d2'::uuid), -- Wedding Vintage Enclosed Photo Booth
  ('24ec5132-bab0-43a9-a689-ffd64dd35b0b'::uuid), -- Wedding Photo Template
  ('d0f36642-62c8-4718-b8ae-6aeaf9ab258c'::uuid), -- Wedding Vintage Scrapbook Photo
  ('7f9ac491-fd3c-43e1-b4eb-b8cc1259dd7d'::uuid), -- Wedding Classic Photo Booth
  ('c030e3da-9db5-4bf1-8709-f536dd7e0b46'::uuid), -- Bartender
  ('f10eeceb-8d7c-439d-8615-a1406c5d53ba'::uuid), -- Poolside Wedding Couple
  ('bd6422c8-594f-40a8-821e-9b570dd76d92'::uuid), -- Beach Wedding Couple
  ('09969591-5788-43be-8f56-d9a80770a53c'::uuid), -- Mr. & Mrs. Wedding Couple
  ('a95b6cd2-5bbf-4487-a6fb-86e0e85b4b52'::uuid), -- Evening Wedding Arch
  ('086c2a07-7a3a-4cdc-8c05-1cbcaede759d'::uuid), -- Ana & Rob
  ('a7c7483f-3060-406d-b1b1-dbb9bd3a13c1'::uuid), -- Kristen & Frank
  ('47ed0910-4f8b-42cc-ad95-94d2c9df6b4e'::uuid), -- Ezzy & Tim, the Newlyweds
  ('f341de33-c705-4d35-b108-2c562ff7751b'::uuid), -- Sarah & Sida First Dance
  ('3d7907c6-bc6a-4586-87fd-ad7552b58eaa'::uuid), -- A blessing at the altar - Paul wedding, Parkland
  ('bfca8ed1-1cad-4216-a048-4c2e622d536a'::uuid), -- Getting ready - Paul wedding, Parkland
  ('a3c64e19-ac46-4487-b337-5fd66389845a'::uuid), -- Kiss in the stone archway - Paul wedding, Parkland
  ('c185430b-164e-48eb-8871-40dbb693c948'::uuid), -- Team Bride - Paul wedding, Parkland
  ('35956b27-7e0f-4c35-9b5b-768e6b822f33'::uuid), -- Groomsmen by the lake - Paul wedding, Parkland
  ('2f5fb52c-7ca1-49db-8ff0-744c82f6ec87'::uuid), -- Outdoor reception under string lights
  ('2fcb100d-0dc9-49a7-b4c7-4f4c5524a16f'::uuid), -- First dance on a floral dance floor
  ('d320aaae-de69-4d8f-a057-2fd6205ac38c'::uuid), -- Bridesmaids holding wedding flowers
  ('8b69a058-596b-46f9-acef-0aa07d0981a0'::uuid), -- Getting ready with the bridesmaids
  ('ecc8fc25-d148-4f05-8e9e-2ea976848eb4'::uuid), -- Sparkler celebration at night
  ('09b92d6e-e915-4b3a-907e-49a41d5a8869'::uuid), -- Beachfront ceremony under the palms
  ('f4fbe191-32df-4916-91cf-9a8d1f0c40ac'::uuid), -- Seaside vows
  ('a68a2ece-3525-436d-b609-cd2f36eb2a5b'::uuid), -- Blooms & greenery
  ('407122d2-bdcb-4319-93a4-0370b3628a93'::uuid), -- Garden party
  ('9314d501-8fac-4aa2-9af2-d788a3e9f0de'::uuid), -- Monochrome tablescape
  ('1ea78248-c247-437d-b75d-f5cec91457be'::uuid), -- Statement florals
  ('36daebda-bee5-4825-810e-6ab52d4134c6'::uuid), -- Clean lines
  ('e94391a6-47ba-4688-9ae8-1e6013bfe95c'::uuid) -- Ocean breeze
) as v(id));
