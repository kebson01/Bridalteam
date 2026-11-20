-- Retitles Bridal Team starter looks (is_seed) whose titles didn't describe
-- the photo. The first batch was named after a mood or theme ("Monochrome
-- tablescape" was a studio portrait of a couple; "Vineyard warmth" a Mr & Mrs
-- sign), and those titles are shown as captions on /inspiration, on each
-- photo's own page and in the homepage mosaic. One more ("Gulf Coast beach
-- ceremony") claimed a place the stock photo doesn't show.
--
-- New titles follow the later seed batch: a plain description of what is in
-- the picture. Themes and colours are unchanged. Each update only applies
-- while the title is still the old one, so a title edited by hand since is
-- left alone.

update public.inspiration_images as i
set title = v.new_title
from (values
  ('b6c4817d-6862-4e49-afea-db192c63a99c'::uuid, 'Gulf Coast beach ceremony', 'Beach table set beside the arch'),
  ('cd2d8061-bd94-4b6e-bfd0-9de09c87b317'::uuid, 'Free-spirited florals', 'Pampas arch in the woods'),
  ('5f229c27-3220-461e-87cb-a9500cc7e08c'::uuid, 'Desert bohemian', 'Boho dessert table with dried flowers'),
  ('e7edaef5-000c-48ef-911f-aac7481f4c7d'::uuid, 'Beach neutrals', 'Sandbar arch with a sailboat'),
  ('e94391a6-47ba-4688-9ae8-1e6013bfe95c'::uuid, 'Ocean breeze', 'Running along the shore'),
  ('443477f3-0433-4af4-8d62-2dbc17eb0a10'::uuid, 'Dried florals', 'Hillside ceremony with a triangle arch'),
  ('a68a2ece-3525-436d-b609-cd2f36eb2a5b'::uuid, 'Blooms & greenery', 'Newlywed selfie in the garden'),
  ('407122d2-bdcb-4319-93a4-0370b3628a93'::uuid, 'Garden party', 'Under a canopy of lights'),
  ('9314d501-8fac-4aa2-9af2-d788a3e9f0de'::uuid, 'Monochrome tablescape', 'Studio portrait with calla lilies'),
  ('1ea78248-c247-437d-b75d-f5cec91457be'::uuid, 'Statement florals', 'Down the aisle on a red runner'),
  ('36daebda-bee5-4825-810e-6ab52d4134c6'::uuid, 'Clean lines', 'Ball gown against white panelling'),
  ('e7ea278a-a39c-47f3-84c7-53a3872fdc61'::uuid, 'Greenhouse ceremony', 'White pavilion on the lawn'),
  ('22b6a4c9-fb1b-4d77-9803-541037c39ca6'::uuid, 'Vineyard warmth', 'Mr & Mrs sign in the trees'),
  ('dbc739b2-7426-4719-bd74-1a42cdd8c585'::uuid, 'Grand & formal', 'Crystal candelabras and stage lights'),
  ('5b9cb019-f1ff-4a0a-b466-158955bfe848'::uuid, 'Barn & candlelight', 'Vow books tied with ribbon'),
  ('203925e1-d275-42f7-ac11-884bcae390f7'::uuid, 'Timeless elegance', 'Chandelier banquet hall')
) as v(id, old_title, new_title)
where i.id = v.id
  and i.title = v.old_title;
