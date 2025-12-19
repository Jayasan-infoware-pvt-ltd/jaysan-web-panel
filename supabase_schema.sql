-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PRODUCTS TABLE
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  quantity integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BILLS TABLE
create table bills (
  id uuid default uuid_generate_v4() primary key,
  customer_name text,
  customer_phone text,
  total_amount numeric not null,
  gst_applied boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BILL ITEMS TABLE
create table bill_items (
  id uuid default uuid_generate_v4() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  product_id uuid references products(id),
  product_name text not null, -- Store name in case product is deleted
  quantity integer not null,
  price_at_sale numeric not null
);

-- REPAIRS TABLE
create table repairs (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  contact_number text,
  device_details text not null,
  issue_description text,
  status text check (status in ('Received', 'In Process', 'Part Not Available', 'Repaired', 'Delivered')) default 'Received',
  custom_message text,
  estimated_cost numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to update updated_at on repairs
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_repairs_updated_at
    before update on repairs
    for each row
    execute procedure update_updated_at_column();
