/** Business details shown on legal and contact pages (Razorpay requires them). Set in Vercel env; replace the defaults before applying for Razorpay. */
export const BIZ = {
  legal: process.env.NEXT_PUBLIC_LEGAL_NAME || "Jamva (legal entity name to be added)",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@jamva.in",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "To be added",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Ahmedabad, Gujarat, India (full registered address to be added)",
  updated: "27 November 2026",
};
