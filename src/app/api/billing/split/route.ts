import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basePrice } = body;

    if (basePrice === undefined || basePrice < 0) {
      return NextResponse.json({ error: 'Invalid or missing basePrice parameter.' }, { status: 400 });
    }

    // Calculations in integer cents to protect margins
    const baseCents = Math.round(basePrice * 100);
    
    // Formula: Total Charged = Round((Base + 1.80) / 0.961)
    const totalCents = Math.round((baseCents + 180) / 0.961);
    
    // Stripe processing: 2.9% + 30 cents
    const stripeCents = Math.round((totalCents * 0.029) + 30);
    
    // Platform cut: Flat $1.50 + 1%
    const platformCents = Math.round(150 + (baseCents * 0.01));
    
    const payoutCents = totalCents - stripeCents - platformCents;

    return NextResponse.json({
      basePrice,
      totalCharged: totalCents / 100,
      stripeFee: stripeCents / 100,
      platformProfit: platformCents / 100,
      venuePayout: payoutCents / 100,
      mathProof: `C_total = Round((${basePrice} + 1.80) / 0.961) = $${(totalCents / 100).toFixed(2)}`
    });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg || 'Server error during billing split.' }, { status: 500 });
  }
}
