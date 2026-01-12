import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
        console.log('🔑 Loaded Stripe Key ending in:', secretKey.slice(-4));

        if (!secretKey) {
            console.error('Missing STRIPE_SECRET_KEY in environment variables');
            return NextResponse.json(
                { error: 'Server configuration error: Missing Stripe Secret Key. Please add it to .env.local and restart.' },
                { status: 500 }
            );
        }

        const stripe = new Stripe(secretKey);

        const { userId, product = 'heritage_pack' } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get user email from Supabase
        const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Define product details
        const products = {
            heritage_pack: {
                name: 'RinkSpot Heritage Pack',
                description: 'Unlock classic hockey city colors & avatars: Montreal, Toronto, Boston, Detroit',
                price: 399, // $3.99
            },
            enforcer_pack: {
                name: 'RinkSpot Enforcer Pack',
                description: 'Custom street hockey enforcer avatar with battle scars',
                price: 299, // $2.99
            },
            nostalgia_pack: {
                name: 'RinkSpot Nostalgia Pack',
                description: 'Defunct 80s hockey cities: Quebec, Hartford, Minnesota',
                price: 399, // $3.99
            },
        };

        const selectedProduct = products[product as keyof typeof products] || products.heritage_pack;

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: selectedProduct.name,
                            description: selectedProduct.description,
                        },
                        unit_amount: selectedProduct.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
            customer_email: user.email,
            metadata: {
                userId,
                product,
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
