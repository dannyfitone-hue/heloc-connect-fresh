export const CLIENT_STATUSES = [
  "Application Received",
  "Application Being Processed",
  "Matching The Right Mortgage Company",
  "Company Matched",
  "Company Will Contact You Shortly",
  "Documents Requested",
  "Funded",
  "Rejected"
];

export const DOCUMENT_TYPES = [
  "Driving License",
  "3 Month Most Recent Bank Statement",
  "12 Months Of Bank Statements",
  "Other Docs"
];

export function money(value: any) {
  return Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
