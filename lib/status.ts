export const clientStatuses=["Application Received","Application Being Processed","Matching The Right Lender","Lender Matched","Lender Will Contact You Shortly","Documents Requested","Funded","Rejected"];
export const statusSteps=["Application Received","Application Being Processed","Matching The Right Lender","Lender Matched","Lender Will Contact You Shortly"];
export const documentOptions=["Valid State ID","Most recent 3 months bank statements","Last 6 months bank statements","Last 12 months bank statements","Tax Returns","Other Documents"];
export function statusIndex(status:string){if(status==="Documents Requested")return 3;if(status==="Funded")return 4;if(status==="Rejected")return 2;const i=statusSteps.indexOf(status);return i>=0?i:0}
export function payoutForLead(a:any){const n=Number(a||0);if(n>=500000)return 3500;if(n>0)return 1500;return 0}
