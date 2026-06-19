# RC-505mk2 Guide — Monetization Wiring Playbook

**Step-by-step integration guide for every revenue touchpoint**

*February 2026*

---

## Table of Contents

1. [Launch Sequence (Priority Order)](#1-launch-sequence-priority-order)
2. [Display Ads — Google AdSense](#2-display-ads--google-adsense)
3. [Display Ads — Ezoic (Upgrade Path)](#3-display-ads--ezoic-upgrade-path)
4. [Display Ads — Carbon Ads (Premium Option)](#4-display-ads--carbon-ads-premium-option)
5. [Affiliate Marketing — Amazon Associates](#5-affiliate-marketing--amazon-associates)
6. [Affiliate Marketing — Sweetwater](#6-affiliate-marketing--sweetwater)
7. [Affiliate Marketing — Thomann (International)](#7-affiliate-marketing--thomann-international)
8. [Digital Product Sales — Gumroad](#8-digital-product-sales--gumroad)
9. [Email Newsletter — Kit (ConvertKit)](#9-email-newsletter--kit-convertkit)
10. [Email Newsletter — Buttondown (Alternative)](#10-email-newsletter--buttondown-alternative)
11. [Tips & Support — Buy Me a Coffee](#11-tips--support--buy-me-a-coffee)
12. [Tips & Support — Ko-fi (Alternative)](#12-tips--support--ko-fi-alternative)
13. [Wiring Checklist — Connecting Code to Services](#13-wiring-checklist--connecting-code-to-services)
14. [Analytics & Tracking Setup](#14-analytics--tracking-setup)
15. [Legal Requirements](#15-legal-requirements)
16. [Revenue Projections (Rough Estimates)](#16-revenue-projections-rough-estimates)

---

## 1. Launch Sequence (Priority Order)

The recommended timeline for setting up monetization on the RC-505mk2 Guide website ensures you capture every revenue opportunity from day one. Follow this sequence to maximize earnings potential.

### Day 1 (Pre-Launch)

- **Amazon Associates** — Apply and get approved (3–5 business days)
- **Gumroad** — Create account and upload preset packs
- **Buy Me a Coffee** — Set up page and get embed code
- **Email Service** — Configure Kit (ConvertKit) or Buttondown for newsletter

### Week 1 (Post-Launch)

- **Google AdSense** — Submit application with live URL
- Deploy affiliate links throughout the guide (Amazon, Gumroad)
- Begin promoting email signup to build subscriber list

### Week 4+

- **Ezoic** — Apply once you have consistent traffic (recommend 100+ daily visitors)
- **Carbon Ads** — Submit application (selective approval process)

### Month 3+

- **Mediavine** — Target application when reaching 50,000+ sessions/month
- **Sweetwater Affiliate** — Apply if approved for Amazon Associates

---

## 2. Display Ads — Google AdSense

Google AdSense is the foundational display advertising platform. It requires minimal setup and provides steady baseline revenue through CPM (cost per thousand impressions).

### Step-by-Step Setup

1. **Sign Up** — Go to <https://adsense.google.com> and sign in with your Google account. Click "Get Started" and follow the initial account setup.

2. **Verify Site Ownership** — Add the provided meta tag to your site's `<head>` or use the `ads.txt` verification method.

3. **Create `ads.txt` File** — In your `public/` root directory, create a file named `ads.txt` with the following content (replace the pub ID):

   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```

4. **Wait for Approval** — Google reviews your application (typically 24 hours to 2 weeks). Check your AdSense account for status updates.

5. **Create Ad Units** — Once approved, navigate to **Ads > By ad unit**. Create units for these placements:
   - **Leaderboard (728x90)** — Hero banner area
   - **Rectangle (300x250)** — Sidebar main position
   - **Skyscraper (300x600)** — Sidebar tall position
   - **Responsive** — In-content article sections
   - **Anchor** — Mobile bottom bar

### React Integration Code

```jsx
// In a component like AdSlot.jsx:
useEffect(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {}
}, []);

return (
  <ins
    className="adsbygoogle"
    style={{ display: 'block' }}
    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
    data-ad-slot="XXXXXXXXXX"
    data-ad-format="auto"
    data-full-width-responsive="true"
  />
);
```

### Global Script Setup

Add this script to the `<head>` section of your `index.html` file:

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossorigin="anonymous"
></script>
```

Replace all `<div class="ad-slot">` placeholders in your React components with the `AdSlot` component.

> **Note:** AdSense also offers Auto Ads, which automatically fills available ad positions. You can toggle this in the dashboard for simplified setup.

---

## 3. Display Ads — Ezoic (Upgrade Path)

Ezoic is an AI-powered ad optimization platform that increases revenue by testing different ad placements and formats automatically.

1. **Sign Up** — Visit <https://www.ezoic.com> and enroll in their Access Now program (available for sites with under 10,000 pageviews).

2. **Choose Integration Method** — Ezoic supports three methods: nameserver integration, WordPress plugin, or JavaScript. For Vercel/static sites, use JavaScript integration.

3. **JavaScript Integration** — Add the Ezoic script to your `<head>` and replace ad placeholders with:

   ```html
   <div id="ezoic-pub-ad-placeholder-101"></div>
   ```

   Use Ezoic's dashboard placeholder IDs.

4. **Enable AI Testing** — Ezoic runs continuous A/B tests to optimize ad placement, size, and format automatically.

5. **Set Payment Method** — Configure PayPal, Payoneer, or bank transfer for payments (minimum payout: $20).

**Revenue Share:** You keep 90%, Ezoic takes 10%. Payouts are calculated automatically each month.

---

## 4. Display Ads — Carbon Ads (Premium Option)

Carbon Ads specializes in serving a single, high-quality ad to developer and creator audiences. Non-intrusive, premium brand-focused approach.

1. **Apply** — Visit <https://www.carbonads.net/> and submit an application. Approval is selective and focused on developer/creator audiences.

2. **Get Approval** — Once approved, you receive a single script tag with your unique serve code and placement ID.

3. **Integration** — Add the script tag to your site `<head>`:

   ```html
   <script
     async
     src="//cdn.carbonads.com/carbon.js?serve=YOUR_CODE&placement=YOUR_ID"
     id="_carbonads_js"
   ></script>
   ```

4. **Placement Strategy** — Best placements are sidebar widgets or hero areas. Carbon shows only ONE ad per page, keeping the site clean.

5. **Monitor Performance** — Track CPC (cost per click) and CPM earnings in your dashboard.

**Revenue Model:** CPC-based (~$0.08 per click), with typical CPM around $1.69. Payouts via PayPal.

---

## 5. Affiliate Marketing — Amazon Associates

Amazon Associates is the largest affiliate network and ideal for recommending the RC-505mk2 and related music equipment.

1. **Sign Up** — Visit <https://affiliate-program.amazon.com/> and complete the enrollment process.

2. **Verify Requirements** — You'll need:
   - Valid tax ID
   - At least 10 original posts
   - A verified bank account
   - **Important:** You must make 3 qualifying sales within 180 days or your account closes.

3. **Generate Links** — Search for "Roland RC-505mk2" in the Product Links tool and copy the affiliate link (contains your tag: `?tag=yourtag-20`).

4. **Create `promoConfig.js` Entries** — In your React app, update `promoConfig.js`:
   - Sidebar "Check Price" button → Amazon affiliate URL
   - Gear recommendations section → Individual affiliate links for each product (SM58, AT2020, cables, etc.)

5. **Add Disclosure** — Include "As an Amazon Associate, I earn from qualifying purchases" in your footer.

**Commission Rates:** Musical instruments typically earn 3–4% commission.

---

## 6. Affiliate Marketing — Sweetwater

Sweetwater offers higher commissions for music-related content and products. Apply through affiliate networks like FlexOffers or Impact.

- **Application:** Apply via Sweetwater's affiliate program (available through FlexOffers.com or Impact.com)
- **Requirements:** Music-relevant traffic and established content
- **Commission Structure:** Tiered from 3.2–8% on online sales
- **Link Generation:** Generate tracking links from Sweetwater's dashboard for RC-505mk2 and gear
- **Strategy:** Use alongside Amazon for different retailer preferences among visitors

---

## 7. Affiliate Marketing — Thomann (International)

Thomann is Europe's largest music retailer and ideal for international traffic. Approval is quick and commission is competitive.

- **Sign Up:** Visit <https://thomann.clickfire.de/> and create an account
- **Approval Timeline:** Typically approved within 24 hours
- **Commission:** Tiered 2–4.5% depending on site type
- **Link Generation:** Generate tracking links from the Thomann dashboard
- **Best For:** International visitors who prefer European retailers

---

## 8. Digital Product Sales — Gumroad

Gumroad handles digital product sales (preset packs, cheat sheets, templates) with minimal friction. You keep 82.5% of each sale.

1. **Create Account** — Sign up at <https://gumroad.com> (instant, free account).

2. **Create Product**
   - **Title:** "RC-505mk2 FX Rack Preset Pack"
   - **Price:** $4.99
   - **Upload:** ZIP file containing PDF cheat sheet + JSON preset data
   - **Description:** Use compelling copy about saving time on manual dial-in

3. **Get Product URL** — Example: `https://yourusername.gumroad.com/l/rc505presets`

4. **Direct Link Integration** — Replace `url: '#'` entries in `promoConfig.js` preset pack sections with the Gumroad URL.

5. **Overlay Button Integration** — Add Gumroad JS to `index.html`:

   ```html
   <script src="https://gumroad.com/js/gumroad.js"></script>
   ```

   Then use:

   ```html
   <a class="gumroad-button" href="...">Get the Pack</a>
   ```

6. **Fee Structure** — Gumroad charges 10% + $0.50 per transaction.

7. **Payouts** — Automatic Friday payouts to your connected bank or PayPal account.

---

## 9. Email Newsletter — Kit (ConvertKit)

Kit is ConvertKit's email platform. Free tier supports up to 10,000 subscribers with powerful automation and landing page tools.

1. **Sign Up** — Create account at <https://kit.com> (free tier available).

2. **Create Form** — Go to **Grow > Landing Pages & Forms**. Create an "Inline" form with just email field + button. Set tag to "RC-505 Guide Subscriber".

3. **Get Embed Code** — Kit provides JavaScript embed code:

   ```html
   <script
     async
     data-uid="YOUR_FORM_UID"
     src="https://kit.com/forms/YOUR_FORM_ID/embed.js"
   ></script>
   ```

4. **API Integration** — For custom-styled forms, use Kit's API endpoint:

   ```
   POST https://api.convertkit.com/v3/forms/FORM_ID/subscribe
   Body: { "api_key": "YOUR_KEY", "email": "user@example.com" }
   ```

5. **Set Up Automation** — Create welcome sequence:
   - **Email 1:** Welcome + guide link + preset pack mention
   - **Email 2 (day 3):** Getting started tips
   - **Email 3 (day 7):** Gear recommendations + affiliate links

6. **Upgrade Path** — Creator plan ($39/mo) unlocks advanced sequences and analytics when your list grows.

---

## 10. Email Newsletter — Buttondown (Alternative)

Buttondown is a lightweight, simple email platform. Free tier supports 1,000 subscribers. Great for getting started without complexity.

- **Sign Up:** Create account at <https://buttondown.com>
- **Simplicity:** Easier to use than Kit, focused on newsletters
- **Embed Form:** Pure HTML form (no JavaScript required):

  ```html
  <form method="post" action="https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME">
    <input type="email" name="email" placeholder="your@email.com" required />
    <button type="submit">Subscribe</button>
  </form>
  ```

- **Ideal Placements:** Exit modals and sidebars (lightweight, no dependencies)

---

## 11. Tips & Support — Buy Me a Coffee

Buy Me a Coffee enables readers to support you directly with tips. Simple setup with customizable messaging and widget placement.

1. **Sign Up** — Visit <https://buymeacoffee.com/signup> (instant, free account).

2. **Customize Page** — Set profile name to "RC-505 Guide", coffee price to $3–$5, and add personalized thank you message.

3. **Floating Widget** — Add to your site:

   ```html
   <script
     data-name="BMC-Widget"
     data-cfasync="false"
     data-id="YOUR_USERNAME"
     data-description="Support me!"
     data-message="If this guide helped you..."
     data-color="#FFAA00"
     data-position="Right"
     data-x_margin="18"
     data-y_margin="18"
     src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
   ></script>
   ```

4. **Direct Link** — Use `https://buymeacoffee.com/YOUR_USERNAME` in React components for sidebar and banner links.

5. **Update `promoConfig`** — Replace coffee entry URLs with Buy Me a Coffee URL.

6. **Fee Structure** — 5% platform fee + ~3% payment processing.

7. **Payouts** — Instant to your bank account (daily if enabled).

---

## 12. Tips & Support — Ko-fi (Alternative)

Ko-fi is another excellent alternative for accepting tips and selling digital products with a 0% platform fee.

- **Sign Up:** Create account at <https://ko-fi.com>
- **Platform Fee:** 0% on tips and donations (free plan)
- **Embed Options:** Floating button widget or inline donation panel (iframe)
- **Digital Products:** Can also sell digital products (5% fee on free plan)
- **Use Case:** Great complement to or replacement for Buy Me a Coffee

---

## 13. Wiring Checklist — Connecting Code to Services

This checklist maps every UI element to the service it connects with and the file to update. Use this as your implementation roadmap.

| Touchpoint in React | File to Edit | What to Replace | Service |
| --- | --- | --- | --- |
| Sidebar "Check Price" button | `Sidebar.jsx` | `href="#"` → Amazon affiliate URL | Amazon Associates |
| Sidebar display ad (300x250) | `Sidebar.jsx` | ad-slot div → AdSense component | Google AdSense |
| Sidebar tall ad (300x600) | `Sidebar.jsx` | ad-slot div → AdSense component | Google AdSense |
| Sidebar newsletter form | `Sidebar.jsx` | form action → Kit/Buttondown endpoint | Kit or Buttondown |
| Sidebar "Buy on Gumroad" link | `Sidebar.jsx` | `href="#"` → Gumroad product URL | Gumroad |
| Sidebar "Buy Me a Coffee" link | `Sidebar.jsx` | `href="#"` → BMC page URL | Buy Me a Coffee |
| In-content ad slots | `PromoSlot.jsx` | ad placeholder → AdSense component | Google AdSense |
| Preset pack promos | `promoConfig.js` | `url: '#'` → Gumroad URL | Gumroad |
| Check price promos | `promoConfig.js` | `url: '#'` → Amazon affiliate URL | Amazon Associates |
| Subscribe promos | `PromoSlot.jsx` | form → Kit API endpoint | Kit |
| Coffee banner | `PromoSlot.jsx` | `href="#"` → BMC page URL | Buy Me a Coffee |
| Gear recommendation links | `promoConfig.js` | all `url: '#'` in gearBySection → affiliate URLs | Amazon/Sweetwater |
| Exit modal newsletter | `App.jsx` | form → Kit/Buttondown endpoint | Kit or Buttondown |
| Mobile bottom bar ad | `App.jsx` | ad placeholder → AdSense component | Google AdSense |
| Hero banner ad (if added) | `App.jsx` | ad slot → AdSense component | Google AdSense |
| Footer affiliate disclosure | `App.jsx` | Already present — update wording if needed | All affiliates |

---

## 14. Analytics & Tracking Setup

Proper analytics setup is critical for understanding where revenue comes from and optimizing your monetization strategy.

### Google Analytics 4

- **Create Property:** Visit analytics.google.com and create a new GA4 property for your site
- **Get Measurement ID:** Copy the Measurement ID (format: `G-XXXXXXXXXX`)
- **Add Script:** Uncomment the GA4 script in `index.html` and replace the placeholder ID

### Vercel Analytics

- **Enable in Dashboard:** Go to Vercel dashboard > project > Analytics and enable
- **Free Tier:** 2,500 events per month (sufficient for tracking affiliate and ad clicks)

### UTM Parameters for Affiliate Tracking

Use different UTM tags for different affiliate link placements to track which positions convert best:

```
?tag=rc505guide-sidebar-20
?tag=rc505guide-gear-20
?tag=rc505guide-email-20
```

---

## 15. Legal Requirements

Compliance with legal requirements protects your users and business. These items are essential for monetized sites.

### Privacy Policy

- **Requirement:** Required by Google AdSense and GDPR compliance
- **Generator:** Use free services like Termly.io or PrivacyPolicies.com
- **Content:** Must mention cookies, third-party ads, affiliate links, email collection
- **Placement:** Add link in footer of every page

### Affiliate Disclosure (FTC Required)

- **Location:** Already in footer — verify coverage of all affiliate programs
- **Wording:** Example: "As an Amazon Associate, I earn from qualifying purchases. I may also earn from other affiliate programs."
- **Per-Page:** Each page with affiliate links should have disclosure

### Cookie Consent Banner

- **Requirement:** Required for EU visitors under GDPR
- **Solution:** Use lightweight CookieConsent.js (free)
- **Installation:** Add script to `index.html` `<head>`

### Terms of Service

- **Optional:** Recommended but not legally required
- **Generator:** Use TermsFeed.com or similar free service

---

## 16. Revenue Projections (Rough Estimates)

These estimates help you set realistic expectations for revenue at different traffic levels. Actual numbers vary significantly based on audience quality and niche (music production content typically outperforms these baseline estimates).

| Monthly Visitors | AdSense (~$2 RPM) | Affiliates (~1% conv, $15 avg) | Gumroad (~0.5% conv) | Email + Tips | Total Est. |
| --- | --- | --- | --- | --- | --- |
| 1,000 | $2 | $2.25 | $2.50 | $5 | ~$12/mo |
| 5,000 | $10 | $11.25 | $12.50 | $15 | ~$49/mo |
| 10,000 | $20 | $22.50 | $25 | $30 | ~$98/mo |
| 50,000 | $100 | $112 | $125 | $80 | ~$417/mo |

> **Note:** These are rough baseline estimates. Niche music production content often outperforms these averages. Optimize placements, focus on content quality, and build email list for better results.
