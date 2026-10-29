# Thawani Integration Handoff

ورّاق جاهز برمجياً لربط ثواني. لا تُحفظ مفاتيح التاجر في الواجهة.

## Edge Functions
- warraq-create-thawani-session
- warraq-verify-thawani-payment
- warraq-thawani-webhook

## دورة العملية
1. create_order يحجز الكتاب ويحسب العمولة وصافي البائع.
2. إنشاء Checkout Session لدى Thawani.
3. المستخدم يدفع عبر القناة المتاحة.
4. Webhook أو verify يعيد التحقق من الجلسة مباشرة من Thawani.
5. mark_order_paid_internal يسجل الدفع ويحول funds_status إلى held.
6. البائع يسلم/يشحن الكتاب.
7. المشتري يؤكد الاستلام.
8. يتم إنشاء seller_payout بقيمة 90% افتراضياً.
9. التسوية من لوحة المشرف حالياً.
10. عند توفر Provider Settlement من Thawani يمكن تحويل الخطوة 9 إلى آلية آلية.

## ملاحظة
Apple Pay وGoogle Pay والبطاقة قنوات دفع، بينما Thawani هو مزود الدفع. تُفعل القنوات في marketplace_settings فقط بعد أن يؤكد Thawani تفعيلها لحساب التاجر.
