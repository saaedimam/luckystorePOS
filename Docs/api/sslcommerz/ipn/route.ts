import { NextRequest, NextResponse } from 'next/server';

type SSLReturnData = Record<string, string>;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const data: SSLReturnData = Object.fromEntries(form) as SSLReturnData;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('IPN received:', data);
    }

    const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${data.val_id}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&v=1&format=json`;

    const response = await fetch(validationUrl);
    const result: SSLReturnData = (await response.json()) as SSLReturnData;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('IPN validation:', result);
    }

    const valid =
      result.status === 'VALID' || result.status === 'VALIDATED';

    return NextResponse.json({ ok: valid });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('IPN error:', error);
    }

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

