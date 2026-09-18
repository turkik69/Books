-- Warraq v2 security hardening
-- Applied to Supabase project Booksale (eooytvurkabmiooknbgk) on 2026-09-18.
-- Keep this file as the source-controlled record of the production changes.

revoke execute on function public.confirm_delivery(uuid) from public, anon;
revoke execute on function public.create_order(uuid, text, text) from public, anon;
revoke execute on function public.mark_shipped(uuid, text) from public, anon;
revoke execute on function public.is_current_user_admin() from public, anon;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

grant execute on function public.confirm_delivery(uuid) to authenticated;
grant execute on function public.create_order(uuid, text, text) to authenticated;
grant execute on function public.mark_shipped(uuid, text) to authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

alter table public.orders drop constraint if exists orders_order_status_check;
alter table public.orders add constraint orders_order_status_check
check (order_status = any (array[
  'pending_payment','paid','shipped','delivered','settled','cancelled','disputed'
]::text[]));

alter table public.orders alter column order_status set default 'pending_payment';

create or replace function public.create_order(
  p_book_id uuid,
  p_payment_method text,
  p_delivery_method text default 'pickup'::text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_book public.books;
  v_commission_rate numeric := 0.10;
  v_delivery_fee numeric;
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;

  if p_payment_method not in ('thawani', 'paypal', 'card') then
    raise exception 'طريقة دفع غير صالحة';
  end if;

  if p_delivery_method not in ('pickup', 'home') then
    raise exception 'طريقة استلام غير صالحة';
  end if;

  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if v_book is null then
    raise exception 'الكتاب غير موجود';
  end if;

  if v_book.status <> 'available' then
    raise exception 'هذا الكتاب لم يعد متاحاً للبيع';
  end if;

  if v_book.seller_id = auth.uid() then
    raise exception 'لا يمكنك شراء كتابك الخاص';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and profile_completed = true
  ) then
    raise exception 'يجب إكمال بياناتك الشخصية قبل الشراء';
  end if;

  v_delivery_fee := case when p_delivery_method = 'home' then 2.00 else 1.00 end;

  update public.books set status = 'reserved' where id = p_book_id;

  insert into public.orders (
    book_id, buyer_id, seller_id, book_price,
    commission_amount, seller_net_amount,
    payment_method, payment_status, order_status,
    delivery_method, delivery_fee
  ) values (
    p_book_id, auth.uid(), v_book.seller_id, v_book.price,
    round(v_book.price * v_commission_rate, 2),
    round(v_book.price * (1 - v_commission_rate), 2),
    p_payment_method, 'pending', 'pending_payment',
    p_delivery_method, v_delivery_fee
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.create_order(uuid,text,text) from public, anon;
grant execute on function public.create_order(uuid,text,text) to authenticated;
