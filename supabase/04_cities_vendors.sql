-- JAMVA: street vendors, cities (Live vs Waitlist), richer leads, vendor pricing. Run after 03. Safe to re-run.
create table if not exists jm_cities (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, state text,
  status text not null default 'waitlist' check (status in ('live','waitlist')), sort_order int not null default 100, created_at timestamptz not null default now()
);
alter table jm_cities enable row level security;
drop policy if exists jm_pub_cities on jm_cities; create policy jm_pub_cities on jm_cities for select using (true);
insert into jm_cities(slug,name,state,status,sort_order) values
 ('ahmedabad','Ahmedabad','Gujarat','live',1),('gandhinagar','Gandhinagar','Gujarat','waitlist',10),('surat','Surat','Gujarat','waitlist',11),('vadodara','Vadodara','Gujarat','waitlist',12),('rajkot','Rajkot','Gujarat','waitlist',13),
 ('mumbai','Mumbai','Maharashtra','waitlist',20),('pune','Pune','Maharashtra','waitlist',21),('delhi','Delhi','Delhi','waitlist',22),('noida','Noida','Uttar Pradesh','waitlist',23),('gurugram','Gurugram','Haryana','waitlist',24),
 ('bengaluru','Bengaluru','Karnataka','waitlist',25),('hyderabad','Hyderabad','Telangana','waitlist',26),('chennai','Chennai','Tamil Nadu','waitlist',27),('kolkata','Kolkata','West Bengal','waitlist',28),
 ('jaipur','Jaipur','Rajasthan','waitlist',29),('udaipur','Udaipur','Rajasthan','waitlist',30),('indore','Indore','Madhya Pradesh','waitlist',31),('bhopal','Bhopal','Madhya Pradesh','waitlist',32),
 ('lucknow','Lucknow','Uttar Pradesh','waitlist',33),('chandigarh','Chandigarh','Chandigarh','waitlist',34),('kochi','Kochi','Kerala','waitlist',35),('nagpur','Nagpur','Maharashtra','waitlist',36)
on conflict (slug) do nothing;

insert into jm_areas(slug,name,lat,lng,sort_order) values
 ('cg-road','CG Road',23.0305,72.5593,17),('manek-chowk','Manek Chowk',23.0242,72.5871,18),('law-garden','Law Garden',23.0258,72.5575,19),('hl-college-road','HL College Road',23.0345,72.5465,20),
 ('ellisbridge','Ellisbridge',23.0245,72.5655,21),('sabarmati','Sabarmati',23.0815,72.5842,22),('isanpur','Isanpur',22.9686,72.6025,23),('vastral','Vastral',23.0,72.65,24)
on conflict (slug) do nothing;

-- Restaurants table also holds street vendors and carts (kind).
alter table jm_restaurants add column if not exists kind text not null default 'restaurant';
alter table jm_restaurants drop constraint if exists jm_restaurants_kind_check;
alter table jm_restaurants add constraint jm_restaurants_kind_check check (kind in ('restaurant','cloud_kitchen','cafe_bakery','street_vendor'));
alter table jm_restaurants add column if not exists landmark text;
alter table jm_restaurants add column if not exists fssai_status text not null default 'have';
alter table jm_restaurants add column if not exists city text not null default 'Ahmedabad';
alter table jm_restaurants add column if not exists pincode text;
alter table jm_restaurants add column if not exists location_updated_at timestamptz;
alter table jm_restaurants add column if not exists plan text;

alter table jm_payments add column if not exists plan text;

-- Leads and waitlist: any role, any city.
alter table jm_waitlist drop constraint if exists jm_waitlist_kind_check;
alter table jm_waitlist add constraint jm_waitlist_kind_check check (kind in ('customer','restaurant','vendor','driver'));
alter table jm_waitlist add column if not exists city text;
alter table jm_waitlist add column if not exists pincode text;
alter table jm_waitlist add column if not exists details jsonb;
alter table jm_waitlist add column if not exists status text not null default 'new';
alter table jm_waitlist add column if not exists note text;

alter table jm_drivers add column if not exists city text not null default 'Ahmedabad';
alter table jm_drivers add column if not exists pincode text;
alter table jm_drivers add column if not exists licence_status text not null default 'yes';
alter table jm_drivers add column if not exists shift text;

insert into jm_settings(key, value) values ('vendor_listing', '{"monthly_fee":199,"yearly_fee":1499,"gst_percent":18,"trial_days":90}'::jsonb) on conflict (key) do nothing;
drop policy if exists jm_pub_settings on jm_settings; create policy jm_pub_settings on jm_settings for select using (key in ('fees','listing','brand','vendor_listing'));
