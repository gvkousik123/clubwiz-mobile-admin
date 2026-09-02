# App Review Notes — ClubWiz Admin (in.clubwiz.admin)

Draft reply to Apple's Guideline 2.1 "Information Needed" rejection of 1.0 (2).
Paste the **Reply to Apple** section into App Store Connect > Resolution Center,
and the same content into **App Review Information > Notes** for every future
submission.

> FILL IN every `<<...>>` placeholder before sending. Do not send it with
> placeholders left in — that guarantees another round trip.

---

## Before you reply — three things to do first

1. **Create a demo account the reviewer can actually use.**
   Login is Firebase phone OTP. An Apple reviewer in the US cannot receive an
   SMS to an Indian number, so they were almost certainly stuck at the OTP
   screen. Add a fixed test number in
   *Firebase Console > Authentication > Sign-in method > Phone > Phone numbers
   for testing*, which returns a hardcoded code with no SMS sent. Then seed that
   account with a real club, a published event, and at least one booking, so the
   reviewer sees a populated app rather than empty states.

2. **Record the screen capture on a physical iPhone**, not the Simulator.
   Apple asks for a device recording explicitly. Install the new build through
   TestFlight and record with the iPhone's built-in screen recorder.

3. **Upload the new build** (build 4, with the camera/photos/location purpose
   strings added). The rejected build 2 had no purpose strings, so the QR ticket
   scanner would terminate the app on first use.

---

## Reply to Apple

Thank you for the review. Please find the requested information below.

**1. Screen recording**

A screen recording captured on a physical <<iPhone model>> running iOS
<<version>> is attached. It begins at app launch and covers: phone-number login
and OTP verification, account registration and profile details, the business
dashboard, creating a club and an event, the camera permission prompt and the
ticket QR scanner, the location permission prompt when setting a venue address,
booking analytics, and the in-app account deletion flow.

**2. Devices and operating systems tested**

<<e.g. iPhone 13, iOS 18.6; iPhone 15 Pro, iOS 26.0; iPad (10th gen), iPadOS 18.6>>

**3. App functions and target audience**

ClubWiz Admin is the business-facing companion to the consumer ClubWiz app. Its
audience is venue owners and their staff — nightclubs, lounges, and event
organizers in India.

The problem it solves: these venues manage event listings, ticket sales, guest
entry, and settlement across phone calls, spreadsheets, and paper guest lists.
ClubWiz Admin gives them one place to publish a venue and its events, set entry
pricing and offers, sell tickets, verify guests at the door by scanning the
ticket QR code, and track bookings and revenue.

The app has three roles:
- **Business (venue owner):** create and edit clubs and events, set entry
  pricing and offers, post stories, view booking and event analytics.
- **Admin (door staff):** scan ticket QR codes at entry, look up a ticket, view
  running ads.
- **Superadmin (ClubWiz internal):** approve clubs, manage payouts, refunds,
  commissions, promos, and support tickets.

There is no consumer-facing ticket purchasing in this app; guests buy tickets in
the separate consumer ClubWiz app. This app contains no in-app purchases or
subscriptions.

**4. Setup and access instructions, including demo credentials**

Login is by phone number and a one-time SMS code. Please use the demo account
below, which is configured to accept a fixed code without an SMS being sent:

- Phone number: <<+1 555 000 0000 — the Firebase test number>>
- OTP code: <<123456>>
- Role: Business (venue owner), pre-loaded with a sample club, a published
  event, and sample bookings.

<<Add a second block here for the Admin / door-staff role if you want the
reviewer to see the scanner path, and a third for Superadmin if that role ships
in this build.>>

To reach the main features after login:
- Ticket scanning: Dashboard > Scan Tickets. Grants camera access, then scans a
  ticket QR code. A sample ticket QR image is attached that can be scanned from
  a second screen, or imported using the "scan from image" option.
- Creating an event: Dashboard > New Event.
- Setting a venue location: Dashboard > Add Location. Grants location access, or
  the address can be entered manually.
- Analytics: Dashboard > Analytics.

**5. External services, tools, and platforms**

- **Firebase Authentication (Google):** phone-number OTP sign-in.
- **Firebase Cloud Messaging (Google):** push notifications for bookings and
  event updates. <<Delete this line if push is not enabled in this build.>>
- **Google Maps Platform:** map display and address selection when setting a
  venue location.
- **ClubWiz backend API (https://clubwiz.in):** our own first-party service,
  which stores clubs, events, bookings, and analytics.
- **<<Payment gateway name, e.g. Razorpay>>:** <<used only for venue payouts /
  not present in this app — pick one and be accurate>>.

The app does not use any AI service, and does not use any third-party data
provider or advertising SDK. <<Correct this if either is untrue.>>

**6. Regional differences**

The app functions consistently across all regions, with no region-gated
features or content. Its venues and events are currently located in India, and
prices are displayed in Indian Rupees, but the app itself behaves identically
wherever it is opened.

**7. Regulated industry / third-party material**

<<Choose the accurate answer and delete the other.>>

- The app does not operate in a regulated industry and contains no protected
  third-party material. All venue and event content is submitted by the
  venue owners who use the app, and is reviewed by ClubWiz before publication.
- OR, if the app shows alcohol-related content: The app is a venue management
  tool for licensed hospitality businesses. It does not sell alcohol and does
  not facilitate alcohol purchases; venue listings may reference a venue's bar
  as one of its amenities. <<Attach venue licensing documentation if you have
  it.>>

Additionally, in this build we have added camera, photo library, and location
purpose strings that were missing from the previously submitted build, which
would have prevented the ticket-scanning feature from running.

Thank you.

---

## Notes on the other tips in Apple's message

- **Screenshots (2.3.3):** confirm your App Store screenshots show the real
  dashboard and scanner in use, not the login or splash screen. This is a common
  second-round rejection.
- **Subscriptions (3.1.2):** not applicable, no IAP in this app.
- **Account deletion (5.1.1(v)) — ACTION NEEDED, likely a second rejection:**
  Apple requires any app that lets users create an account to offer account
  deletion from inside the app. `AuthService.deleteAccount()` exists in
  `lib/services/auth.service.ts:738` and calls `DELETE /auth/delete-account`,
  but nothing in `app/` or `components/` calls it — there is no screen the user
  can reach it from. It also takes a `password` argument, while sign-in is phone
  OTP with no password, so the call as written may not even succeed. Add a
  reachable "Delete account" entry in settings/profile and show it in the
  recording, or expect to be rejected again on this point.
