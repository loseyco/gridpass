# Financial AI Agent Handoff Report

## 1. Observation
I directly observed the structure of the Gridpass.app V4 codebase and identified the existing payment files in:
* `src/app/api/billing/connect/route.ts`
* `src/app/api/billing/checkout/route.ts`
* `src/app/api/billing/webhook/route.ts`
* `package.json`

Specifically, in `src/app/api/billing/checkout/route.ts` at lines 76-85:
```typescript
// Split transaction: Application fee stays on platform, remainder transfers to Connect account
const applicationFeeAmount = Math.round(gridPassFee * 100);

sessionConfig.payment_intent_data = {
  application_fee_amount: applicationFeeAmount,
  transfer_data: {
    destination: stripeAccountId,
  },
};
```
And at line 18:
```typescript
gridPassFee = 1.50, // default fee
```

This confirmed that the checkout system currently retains a flat application fee of **$1.50** on the platform account, while the entire Stripe processing fee ($2.9\% + 30\text{c}$) is deducted from the platform's balance.

I have written the complete, detailed engineering specification to:
`c:\_Projects\Gridpass-v4\business_launch\.agents\financial_agent\stripe_split_billing.md`

---

## 2. Logic Chain
1. **Identified the Breakeven Threshold**: By examining the current implementation, I proved algebraically that the platform incurs a net loss whenever the Stripe fee exceeds the flat fee.
   $$\text{Stripe Processing Fee} = (\text{Base Price} + \$1.50) \times 2.9\% + \$0.30$$
   Equating this to the $1.50 application fee yields a breakeven pass price of **$39.88**. Any price above this results in negative platform margin (e.g. -$1.74 on a $100.00 pass).
2. **Formulated the Dynamic Fee Splitting Model**: To prevent these losses, I derived a mathematically robust split-billing formula where the customer pays:
   $$C_{total} = \text{Round}\left(\frac{P_{pass} + 180}{0.961}\right)$$
   This formula guarantees the venue receives exactly $P_{pass}$ (their ticket price) while the platform receives $1.0\%$ variable margin plus $\$1.50$ net, fully covering Stripe's transaction fees.
3. **Structured Stripe Connect Onboarding Options**: I constructed a comparative analysis between Stripe Express and Stripe Standard accounts, designing standard Express and Standard developer integration endpoints and OAuth exchanges.
4. **Engineered Webhook & Dispute Flows**: I mapped the verification requirements in `account.updated` webhooks and defined the refund/dispute state-machines. I designed an automatic **Collateral Hold trigger** to escrow $DisputedAmount + \$15.00$ to shield Gridpass from liability during disputes.
5. **Configured Payouts & FX Routing**: I specified standard 2-day payouts vs manual instant payouts (with 1.5% fee handling), and established country-matched local currency routing (e.g., CAD for Canadian tracks) to completely bypass Stripe's 1-2% FX double-conversion fees.

---

## 3. Caveats
* **Stripe International Card Fees**: Calculations assume a standard US Stripe processing fee of $2.9\% + 30\text{c}$. International or premium commercial cards may incur higher percentages (e.g. 3.9% + 30c), which would require minor adjustment to the dynamic divisor (e.g. `0.951` instead of `0.961`) to ensure absolute platform profit protection in multi-currency contexts.

---

## 4. Conclusion
The comprehensive engineering specification for the Stripe Connect integration & Split-Billing model has been successfully designed and saved at `c:\_Projects\Gridpass-v4\business_launch\.agents\financial_agent\stripe_split_billing.md`. This architecture completely resolves the breakeven vulnerability, secures transaction processing, and lays out a production-ready roadmap for the engineering team.

---

## 5. Verification Method
1. **Spec Inspection**: Open and review the markdown file at `c:\_Projects\Gridpass-v4\business_launch\.agents\financial_agent\stripe_split_billing.md`.
2. **Mathematical Verification**: Run the `calculateSplitFees` helper in a Node.js console or verify mathematically that a $150.00 base pass charges $157.96, giving the platform a guaranteed positive net profit of $3.08 after paying Stripe's $4.88 processing fee.
