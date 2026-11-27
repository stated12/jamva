-- JAMVA: launch settings and Ahmedabad service areas. Safe to re-run (does not overwrite settings you already changed).
insert into jm_settings(key, value) values
 ('fees', '{"tiers":[{"upto_km":2,"fee":25},{"upto_km":4,"fee":35},{"upto_km":6,"fee":45},{"upto_km":8,"fee":60}],"max_km":8,"gst_percent":18,"small_order_below":0,"cod_enabled":true,"online_enabled":true}'::jsonb),
 ('listing', '{"yearly_fee":6000,"gst_percent":18,"trial_days":90}'::jsonb),
 ('brand', '{"name":"Jamva","tagline":"Pay for the food. Not the platform.","city":"Ahmedabad","support_phone":"","support_email":"","whatsapp":""}'::jsonb)
on conflict (key) do nothing;

-- Approximate area centres (used for delivery-distance estimates). Check and adjust in Admin > Areas.
insert into jm_areas(slug, name, lat, lng, sort_order) values
 ('satellite','Satellite',23.0300,72.5100,1), ('bodakdev','Bodakdev',23.0396,72.5112,2), ('prahlad-nagar','Prahlad Nagar',23.0120,72.5108,3),
 ('vastrapur','Vastrapur',23.0375,72.5290,4), ('thaltej','Thaltej',23.0536,72.5082,5), ('sg-highway','SG Highway',23.0731,72.5160,6),
 ('bopal','Bopal',23.0340,72.4640,7), ('navrangpura','Navrangpura',23.0366,72.5614,8), ('paldi','Paldi',23.0102,72.5601,9),
 ('ambawadi','Ambawadi',23.0210,72.5557,10), ('naranpura','Naranpura',23.0560,72.5530,11), ('memnagar','Memnagar',23.0480,72.5400,12),
 ('ghatlodia','Ghatlodia',23.0720,72.5460,13), ('gota','Gota',23.0988,72.5446,14), ('chandkheda','Chandkheda',23.1000,72.5850,15), ('maninagar','Maninagar',22.9958,72.6024,16)
on conflict (slug) do nothing;

-- Admin: this email becomes admin when it signs up, and is promoted now if the account already exists.
insert into jm_admin_emails(email) values ('avdhesh20@gmail.com') on conflict do nothing;
update jm_profiles set role = 'admin' where id in (select id from auth.users where lower(email) = 'avdhesh20@gmail.com');
