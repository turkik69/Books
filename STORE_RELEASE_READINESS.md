# Warraq Release Readiness

## جاهز برمجياً
- حسابات وتسجيل دخول مع التحقق من البريد.
- شروط استخدام وسياسة خصوصية وإرشادات مجتمع.
- إبلاغ عن المحتوى والمستخدمين وحظر المستخدمين.
- فلترة خادم للمحتوى المخالف قبل النشر.
- حذف حساب من داخل التطبيق ومن صفحة ويب خارجية، مع تنفيذ حذف فعلي من Auth والبيانات الشخصية.
- Web Push + Native Push bridge.
- سوق الكتب والبحث والخريطة الأكاديمية والمفضلة والسلة والرسائل.
- دورة طلبات كاملة مع حالات الدفع والتسليم والتسوية.
- عمولة مركزية افتراضياً 10%.
- Ledger مالي لكل طلب.
- الأموال المدفوعة تسجل كـ held حتى تأكيد الاستلام.
- مستحق بائع واحد فقط لكل طلب.
- تسوية يدوية من لوحة المشرف حالياً، وقابلة للتحويل إلى provider settlement.
- بنية Capacitor أصلية لـ iOS وAndroid.
- GitHub Actions لفحص بناء iOS وAndroid.

## بعد التعاقد مع Thawani
1. إضافة THAWANI_SECRET_KEY.
2. إضافة THAWANI_PUBLISHABLE_KEY.
3. ضبط THAWANI_MODE=live.
4. ضبط WARRAQ_PUBLIC_URL على عنوان الإنتاج.
5. تفعيل Apple Pay / Google Pay / Card في حساب التاجر لدى Thawani.
6. بعد تأكيد القنوات، تحديث marketplace_settings:
   - apple_pay_enabled
   - google_pay_enabled
   - card_enabled
7. اختبار عملية حقيقية بمبلغ صغير من البداية حتى التسوية.
8. تأكيد آلية Marketplace/Wallet/Settlement مع Thawani قبل وصف أي خدمة بأنها Escrow.

## قبل App Store / Google Play
- Apple Developer account + Bundle ID om.warraq.app.
- Apple Merchant ID إذا كان Apple Pay يتطلب دمجاً أصلياً مباشراً.
- APNs Auth Key وإضافته كأسرار WARAAQ_APNS_*.
- Firebase project + FCM service account وإضافة أسرار WARAAQ_FCM_*.
- Signing certificates / provisioning profile لـ iOS.
- Android signing keystore.
- حساب مراجعة تجريبي فعال للمتاجر.
- Screenshots النهائية وأيقونة 1024x1024.
- App Privacy في App Store Connect.
- Data Safety + Account Deletion URL في Play Console.
- Support URL وPrivacy URL وTerms URL.
- اختبار على جهاز iPhone حقيقي وجهاز Android حقيقي.
