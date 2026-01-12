import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature provided' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            // Get user ID from metadata
            const userId = session.metadata?.userId;
            const product = session.metadata?.product;

            if (userId && product) {
                try {
                    // Update user's pack status in Supabase based on product
                    const updateData = product === 'heritage_pack'
                        ? { has_heritage_pack: true }
                        : product === 'enforcer_pack'
                            ? { has_enforcer_pack: true }
                            : product === 'nostalgia_pack'
                                ? { has_nostalgia_pack: true }
                                : {};

                    if (Object.keys(updateData).length > 0) {
                        const { error } = await supabase
                            .from('users')
                            .update(updateData)
                            .eq('id', userId);

                        if (error) {
                            console.error(`Error updating user ${product} status:`, error);
                        } else {
                            console.log(`${product} unlocked for user ${userId}`);
                        }
                    }
                } catch (error) {
                    console.error('Error processing webhook:', error);
                }
            }
            break;
        }

        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.error('PaymentIntent failed:', paymentIntent.id);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
