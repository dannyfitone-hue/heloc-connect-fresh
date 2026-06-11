export const CLIENT_STATUSES = ["Application Received","Application Being Processed","Matching The Right Mortgage Company","Company Matched","Company Will Contact You Shortly","Documents Requested","Funded","Rejected"];
export const DOCUMENT_TYPES = ["Valid State ID","Last 3 Months Bank Statements","Last 6 Months Bank Statements","Last 12 Months Bank Statements","Mortgage Statement","Proof of Income","Other"];
export function money(value:any){return Number(value||0).toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}
