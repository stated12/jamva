-- JAMVA 08: make sure the server's database role (service_role) can use every jm_ table, and add a role check used by Admin > System check.
-- Safe to re-run. Does NOT weaken Row Level Security: service_role bypasses RLS by design and is only used on the server; browsers (anon/authenticated) get no new rights.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
-- Browsers keep read-only access to public catalogue data only (rows still filtered by RLS policies).
do $$ begin
  begin grant select on jm_areas, jm_cities, jm_settings, jm_menu_categories, jm_menu_items to anon, authenticated; exception when undefined_table then null; end;
end $$;
-- Which role is the app really using? Admin > System check calls this. Must say service_role.
create or replace function jm_whoami() returns text language sql stable as $$ select current_user::text $$;
grant execute on function jm_whoami() to anon, authenticated, service_role;
-- Report (read the result grid): rows where service_role is missing a privilege. Empty = good.
select c.relname as table_missing_service_role_access from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'jm\_%' and not has_table_privilege('service_role', c.oid, 'select,insert,update,delete');
