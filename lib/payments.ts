import { createSupabaseAdmin } from "./supabase-admin";
import { purchaseIssueForUser } from "./purchases";

const DEFAULT_PROVIDER = "demo";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getPaymentProvider() {
  return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || DEFAULT_PROVIDER;
}

export async function initiateIssueCheckout(params: {
  userId: string;
  email: string;
  issueId: string;
  title: string;
  amountNaira: number;
  redirectPath?: string | null;
}) {
  const provider = getPaymentProvider();
  const siteUrl = getSiteUrl();
  const redirectPath = params.redirectPath || `/comics`;

  if (provider === "paystack") {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return { error: "Missing Paystack secret key" as const };
    }

    const reference = `damee-${params.issueId}-${params.userId}-${Date.now()}`;
    const callbackUrl = `${siteUrl}/payments/verify?reference=${reference}&issueId=${params.issueId}&redirect=${encodeURIComponent(redirectPath)}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountNaira * 100,
        currency: "NGN",
        callback_url: callbackUrl,
        reference,
        metadata: {
          issue_id: params.issueId,
          user_id: params.userId,
          redirect_path: redirectPath,
          issue_title: params.title,
        },
      }),
    });

    if (!response.ok) {
      return { error: "Unable to initialize Paystack checkout" as const };
    }

    const payload = (await response.json()) as {
      status: boolean;
      data?: { authorization_url: string; reference: string };
    };

    if (!payload.status || !payload.data?.authorization_url) {
      return { error: "Checkout session was not created" as const };
    }

    return {
      error: null,
      provider,
      authorizationUrl: payload.data.authorization_url,
      reference: payload.data.reference,
    };
  }

  const reference = `demo-${params.issueId}-${params.userId}-${Date.now()}`;
  return {
    error: null,
    provider: "demo",
    authorizationUrl: `${siteUrl}/payments/verify?reference=${reference}&issueId=${params.issueId}&redirect=${encodeURIComponent(redirectPath)}`,
    reference,
  };
}

export async function verifyIssuePayment(params: {
  issueId: string;
  reference: string;
  userId: string;
}) {
  const provider = getPaymentProvider();

  if (provider === "paystack") {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return { error: "Missing Paystack secret key" as const };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(params.reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    if (!response.ok) {
      return { error: "Unable to verify payment" as const };
    }

    const payload = (await response.json()) as {
      status: boolean;
      data?: {
        status?: string;
        reference?: string;
        metadata?: { issue_id?: string; user_id?: string };
      };
    };

    const paidIssueId = payload.data?.metadata?.issue_id;
    const paidUserId = payload.data?.metadata?.user_id;

    if (
      !payload.status ||
      payload.data?.status !== "success" ||
      paidIssueId !== params.issueId ||
      paidUserId !== params.userId
    ) {
      return { error: "Payment verification failed" as const };
    }
  } else if (!params.reference.startsWith("demo-")) {
    return { error: "Unknown demo payment reference" as const };
  }

  const supabase = createSupabaseAdmin();
  const userResult = await supabase.auth.admin.getUserById(params.userId);

  if (!userResult.data.user) {
    return { error: "User not found" as const };
  }

  return purchaseIssueForUser({
    issueId: params.issueId,
    paymentReference: params.reference,
    user: userResult.data.user,
  });
}
