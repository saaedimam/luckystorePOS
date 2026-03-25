import { NextRequest, NextResponse } from 'next/server';

type SSLReturnData = Record<string, string>;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const data: SSLReturnData = Object.fromEntries(form) as SSLReturnData;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Fail return:', data);
    }

    return NextResponse.redirect('/checkout/failed');
  } catch {
    return NextResponse.redirect('/checkout/error');
  }
}

