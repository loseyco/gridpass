## 2026-05-25T12:34:48Z
You are a teamwork_preview_worker. Your working directory is c:\_Projects\Gridpass-v4\.agents\worker_m2_m3.
Your task is to implement the following requirements:

### M2. Simplified $1.99/month Pricing Model
1. Overhaul src/app/pricing/page.tsx:
   - Simplify options to focus on a primary subscription model: $1.99/mo per active identity (covers any asset — car, boat, bike, dog, trailer, or pilot profile).
   - Maintain a B2B business tier at $49.00/month tailored for racetracks, event organizers, and dealerships allowing wholesale identity provisioning, printed banners, and secure ticket splits.
   - Adjust the card descriptions, features list, period labels, and buttons accordingly.
2. Update the Stripe checkout integration in src/app/api/billing/checkout/route.ts to support the new pricing parameters:
   - When the user selects a subscription (like $1.99/mo active identity or $49/mo enterprise B2B tier), configure Stripe Checkout with mode: 'subscription' and the price_data.recurring = { interval: 'month' } parameter in line_items.
   - For regular payments (such as day passes or lifetime passes), preserve mode: 'payment'.
   - Ensure transaction prices and fees are converted accurately to integer cents.

### M3. Peer-to-Peer Ownership Transfer Ledger
1. Upgrade the Digital Garage on src/app/dash/page.tsx to support ownership transfers:
   - Add a "Transfer Identity" action/button to each vehicle card in the dashboard.
   - When clicked, open a glassmorphic confirmation modal where the owner enters the new owner's email.
   - You should use/expand the existing React states: showTransferModal, transferVehicle, transferEmail, transferError, transferSuccess, transferring.
   - Implement the transfer handler:
     - Query Firestore users collection to verify the recipient email's registration.
     - If found, transfer the vehicle ownership cleanly by updating the vehicle document's owner_id and owner_email fields in Firestore.
     - When ownership is successfully transferred, write a transaction record to a new 'ownership_transfers' Firestore collection with the following shape:
       {
         "vehicle_id": "vehicleId",
         "previous_owner_id": "prevOwnerId",
         "previous_owner_email": "prevOwnerEmail",
         "new_owner_id": "newOwnerId",
         "new_owner_email": "newEmail",
         "timestamp": serverTimestamp(),
         "date": "YYYY-MM-DD"
       }
     - Make sure the vehicle is removed from the previous owner's list in real-time (the existing real-time listener where('owner_id', '==', user.uid) will handle this automatically once owner_id is updated!).

Verify your changes by running Next.js build (npm run build) and the test suite.
Document all changes made, the files edited, and compilation/test results in changes.md and handoff.md inside your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Send a message back to parent conversation 5a45960c-cd69-44ee-ba0f-b5ffce02593b when complete.
