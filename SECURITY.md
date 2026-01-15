# RinkSpot Security Strategy

This document outlines the 5-point security strategy implemented to protect RinkSpot data from scraping, abuse, and bulk theft.

## 1. Backend Viewport Filtering
**Goal:** Prevent bulk data download.
-   **Implementation**: `app/api/rinks/route.ts`
-   **Mechanism**: The API **requires** a bounding box (`minLat`, `maxLat`, `minLng`, `maxLng`). Requests without these parameters are rejected (400 Bad Request).
-   **Effect**: Scrapers cannot simply "get all rinks". They must spatially iterate, which is slower and detectable.

## 2. Aggressive Rate Limiting
**Goal:** Stop high-frequency abuse.
-   **Implementation**: `middleware.ts`
-   **Mechanism**: Tracks requests per IP address using a token bucket (or counters).
-   **Limit**: **60 requests per minute** per IP.
-   **Response**: `429 Too Many Requests`.
-   **Scope**: Protects all endpoints under `/api/*`.

## 3. Data Tiering (Auth-based)
**Goal:** Protect "High Value" data (Reports/Conditions).
-   **Implementation**: `app/api/reports/route.ts` & `hooks/useRinkData.ts`
-   **Mechanism**: 
    -   **Anonymous Users**: Receive limited data (e.g., only reports from the last 12 hours).
    -   **Authenticated Users**: Receive full value (e.g., reports from the last 48 hours+).
-   **Effect**: Scrapers (usually unauthenticated) get "stale" or limited data. Users are incentivized to log in.

## 4. Honey Pot (Anti-Scraping)
**Goal:** Identify and trap active scrapers.
-   **Implementation**: `scripts/seed_honeypot.ts`
-   **Mechanism**: A fake rink ("Atlantis Rink") is inserted at `0.0, 0.0` (or remote location).
-   **Detection**: Legitimate users using the map will never query these coordinates. Any IP requesting this data (or bounds covering null island) is valid grounds for a permanent ban.

## 5. Cloudflare / Bot Management (Recommended)
**Goal:** Edge-level protection.

Since we are deployed on Vercel (or similar), we recommend putting **Cloudflare** in front.

### Configuration Checklist:
1.  **Bot Fight Mode**: Enable "Super Bot Fight Mode" (Pro) or standard Bot Fight Mode.
2.  **WAF Rules**:
    -   Block requests to `/api/rinks` that do *not* contain `minLat` query param (Redundant with our code, but cheaper to block at edge).
    -   Block User-Agents known to be scrapers (Python-requests, curl, etc. - unless debugging).
    -   Challenge (JS Managed) any non-browser User-Agent.
3.  **Geo-Blocking**:
    -   If the app is Canada/US specific, consider challenging traffic from non-target countries (e.g., RU, CN) if abuse is detected.
4.  **Rate Limiting (Cloudflare side)**:
    -   Configure a rule to Block/Challenge IPs exceeding 100 requests/minute (looser than our internal 60/min logic to avoid false positives, but catches the egregious attacks).

## Summary
The combination of typical "Defense in Depth" layers (Edge -> Middleware -> App Logic -> Data Access) significantly raises the cost for attackers while keeping the app fast for genuine users.
