# Warraq Store Submission Readiness

Updated: 29 October 2026

## Product
- App name: ورّاق
- Bundle / application ID: om.warraq.app
- Core purpose: marketplace for used physical books.
- Account creation: supported.
- Account deletion: available in-app and via delete-account.html.
- User generated content: book listings, book photos, messages, reviews, reports.
- Moderation: server-side prohibited-content filtering, reporting, user blocking, admin review and enforcement.
- Payments: physical goods only. Card data is handled by the payment provider; Warraq does not store full card details.

## App Store privacy answers
Data linked to the user and used for app functionality:
- Contact info: name, email address, phone number, city.
- User content: book listing text, book photos, messages, reviews and reports.
- Purchases: order and settlement records for physical books.
- Identifiers: internal account ID, push notification token.
- No advertising tracking is implemented.
- No sale of personal data is implemented.

## Google Play Data safety
Collected for app functionality / fraud prevention:
- Name, email, phone, approximate city supplied by the user.
- Photos uploaded for book listings.
- Messages and user-generated listing content.
- Purchase and order information for physical goods.
- Device push token for notifications.
Deletion:
- In-app deletion request path is present.
- External deletion URL is delete-account.html.
- Personal data and user-generated content are deleted after approval.
- Limited transaction records may be retained where legally/accounting required after identity separation.

## Review account
Before store submission, create a dedicated non-admin reviewer account with:
- completed profile
- at least one sample listing
- ability to send/receive a message
- no real payment card data
Provide the credentials only in App Store Connect / Play Console review notes.

## Native build
- Capacitor local web bundle; not a remote website wrapper.
- iOS and Android build validation workflow included.
- Native hooks included for camera, deep links and push registration.
- iOS requires Push Notifications capability and APNs key.
- Android requires Firebase google-services.json / FCM service credentials.
- Store signing credentials are intentionally not committed to Git.

## Final external credentials required before signed release
1. Apple Developer Team / signing certificate / provisioning profile.
2. APNs Auth Key (.p8), Key ID, Team ID.
3. Firebase project configuration for Android and FCM service credentials.
4. Google Play signing / upload key or Play App Signing configuration.
5. App Store Connect and Play Console listing metadata/screenshots.
