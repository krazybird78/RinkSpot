-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('rink-photos', 'rink-photos', true)
on conflict (id) do nothing;

-- Allow public access to view photos
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'rink-photos' );

-- Allow authenticated users to upload photos
create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'rink-photos' );

-- Allow authenticated users to delete photos (simplified)
create policy "User Delete"
    on storage.objects for delete
    to authenticated
    using ( bucket_id = 'rink-photos' );
