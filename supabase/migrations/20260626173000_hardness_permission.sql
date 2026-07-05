insert into public.permissions (key, description)
values ('hardness.view', 'Permite acessar os prompts Hardness dos agentes.')
on conflict (key) do update
set description = excluded.description;
