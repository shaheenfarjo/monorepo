import { PhoneOtpForm } from "@repo/auth/components/phone-otp-form";
import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

const title = "Welcome back";
const description = "Sign in with your mobile number.";

export const metadata: Metadata = createMetadata({ description, title });

const SignInPage = () => (
  <div className="grid gap-6">
    <div className="grid gap-1 text-center">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    <PhoneOtpForm />
  </div>
);

export default SignInPage;
