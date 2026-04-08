-- Atomic registration number allocation for student account creation/import.
-- Uses row-level locking on schools to prevent duplicate counters under concurrency.

create or replace function public.next_registration_numbers(
  p_school_id uuid,
  p_count integer default 1
)
returns table(
  reg_number text,
  synthetic_email text,
  school_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_padding integer;
  v_counter integer;
  v_slug text;
  v_start integer;
  v_year integer;
  v_effective_slug text;
  i integer;
begin
  if p_count is null or p_count < 1 then
    p_count := 1;
  end if;

  if p_count > 1000 then
    raise exception 'p_count exceeds maximum allowed (1000)';
  end if;

  select
    reg_number_prefix,
    coalesce(reg_number_padding, 3),
    coalesce(reg_number_counter, 0),
    slug
  into
    v_prefix,
    v_padding,
    v_counter,
    v_slug
  from public.schools
  where id = p_school_id
  for update;

  if not found or v_prefix is null or btrim(v_prefix) = '' then
    return;
  end if;

  v_prefix := upper(btrim(v_prefix));
  v_start := v_counter + 1;
  v_year := extract(year from now())::integer;
  v_effective_slug := coalesce(nullif(v_slug, ''), left(p_school_id::text, 8));

  update public.schools
  set reg_number_counter = v_counter + p_count
  where id = p_school_id;

  for i in 0..(p_count - 1) loop
    reg_number := v_prefix || lpad((v_start + i)::text, v_padding, '0') || '/' || v_year::text;
    synthetic_email := lower(replace(reg_number, '/', '-')) || '@' || v_effective_slug || '.gosmart';
    school_slug := v_effective_slug;
    return next;
  end loop;
end;
$$;

grant execute on function public.next_registration_numbers(uuid, integer) to service_role;
