
# ClubWiz OTP Authentication System

## Purpose

A simple guide to how OTP login works in the app, which files are involved, and what backend endpoints are called.

## Overview

The app uses an email-based OTP flow. Users enter email + phone, get a 6-digit OTP via email, and verify it on the OTP page.

## Flow

1. User enters email and phone number on the mobile login page.
2. The app calls `MobileAuthService.sendOtp(email, phone)`.
3. Backend sends a 6-digit OTP to the user's email.
4. User enters the OTP on the verification page.
5. The app calls `MobileAuthService.validateOtp(email, otp)`.
6. On success, the app stores verified state and redirects the user.

## Main files

| File | Responsibility |
| --- | --- |
| `app/bz/auth/mobile/page.tsx` | Email + phone input, request OTP |
| `app/bz/auth/otp/page.tsx` | OTP verification, resend, redirect |
| `lib/services/mobile-auth.service.ts` | OTP backend API calls |
| `lib/services/jwt.service.ts` | JWT storage and payload handling |
| `lib/constants/storage.ts` | Local storage key names |

## Backend APIs

- `POST /notification/api/otp/send?email=<email>&mobile=<phone>`
- `POST /notification/api/otp/validate?email=<email>&otp=<otp>`

The requests are made through `publicApi` and use query parameters.

## Mobile login page behavior

- Validates the email format.
- Converts the phone number to a 10-digit normalized value.
- Calls `MobileAuthService.sendOtp(email, cleanPhone)`.
- Saves `pendingPhone`, `pendingEmail`, and `otpSessionId` (if provided) in local storage.
- Redirects to `/bz/auth/otp`.

## OTP verification page behavior

- Loads `pendingPhone` and `pendingEmail` from local storage.
- Shows six OTP input fields with auto-focus and paste support.
- Starts a 30-second timer before resend is enabled.
- Calls `MobileAuthService.validateOtp(email, otp)` after 6 digits are entered.
- On success:
  - stores `otpValidated = true`
  - stores `validatedEmail` and `validatedPhone`
  - stores `clubviz-accessToken` if a JWT token is returned
  - redirects existing users to dashboard
  - redirects new users to `/bz/auth/register`

## Local storage keys

| Key | Purpose |
| --- | --- |
| `clubviz-accessToken` | JWT token for authenticated requests |
| `clubviz-pendingPhone` | Phone number for OTP verification |
| `pendingEmail` | Email for OTP verification |
| `otpSessionId` | Optional backend OTP session ID |
| `otpValidated` | OTP verification success flag |
| `validatedEmail` | Verified email after OTP success |
| `validatedPhone` | Verified phone after OTP success |

## Resend flow

- Resend becomes available after 30 seconds.
- It calls `MobileAuthService.sendOtp(email, phoneNumber)` again.
- It clears OTP inputs and resets the timer.

## Success conditions

- If the backend returns a `jwtToken`, the app stores it.
- Registered users are redirected to the dashboard.
- Unregistered users are redirected to signup.

## Notes

- This flow uses a backend OTP service rather than Firebase phone auth.
- The backend is responsible for generating and emailing the OTP.
- The frontend keeps the flow simple: request OTP, verify OTP, save state, redirect.
