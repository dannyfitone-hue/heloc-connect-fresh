import LegalShell from "@/components/LegalShell";

const sections = [
  {
    title: "Information We Collect",
    paragraphs: [
      <>We collect information that you provide directly to us, information collected automatically through your use of the Service, and information we may receive from third parties in connection with matching you to a lending partner.</>
    ],
    bullets: [
      <>Contact information, including your full name, email address, and telephone number.</>,
      <>Property information, including your property address, estimated home value, and current mortgage balance.</>,
      <>Financial information relevant to your inquiry, including credit score range, requested cash amount, income information, and, where applicable, supporting documentation such as bank statements.</>,
      <>Communications you send to us, including messages submitted through contact forms or customer support channels.</>,
      <>Device and browser information, including IP address, browser type, and operating system.</>,
      <>Usage data, including pages visited, time spent on the Service, and interactions with the property equity calculator.</>,
      <>Approximate location information derived from IP address.</>,
      <>Property valuation, public records, and inquiry-status information received from third-party data providers and lending partners.</>
    ]
  },
  {
    title: "How We Use Your Information",
    bullets: [
      <>To match you with a mortgage lender or lending partner in our network suited to your stated needs.</>,
      <>To generate estimated equity, payment, and eligibility information through our calculator tools.</>,
      <>To communicate with you regarding your inquiry, including by SMS, email, and telephone.</>,
      <>To maintain a record of your submission and its status through our client portal.</>,
      <>To operate, maintain, secure, and improve the Service.</>,
      <>To comply with applicable legal, regulatory, and contractual obligations.</>,
      <>To detect, investigate, and prevent fraudulent or unauthorized activity.</>
    ]
  },
  {
    title: "How We Disclose Your Information",
    paragraphs: [
      <><strong className="text-white">Lending Partners.</strong> When you submit an inquiry through the Service, we disclose relevant information you have provided to the mortgage company or lending partner within our network that we determine, in our discretion, is best suited to your stated situation. That lending partner will use your information to contact you directly and evaluate your inquiry under its own privacy practices.</>,
      <><strong className="text-white">Service Providers.</strong> We may share information with third-party vendors who perform services on our behalf, including hosting, data storage, SMS and email delivery, analytics, mapping, property-data services, and security.</>,
      <><strong className="text-white">Legal and Compliance Disclosures.</strong> We may disclose information where required by law, subpoena, or legal process, or where we believe in good faith that disclosure is necessary to protect rights, safety, or the integrity of the Service.</>,
      <><strong className="text-white">Business Transfers.</strong> Information may be transferred in connection with a merger, acquisition, reorganization, financing, or sale of assets, subject to applicable confidentiality and legal protections.</>,
      <><strong className="text-white">No Sale for Independent Third-Party Marketing.</strong> HELOC Connect does not sell personal information to unrelated third parties for their own independent marketing purposes. Compensation from lending partners relates to matching, technology, or marketing services, not the sale of personal information as an independent commodity.</>
    ]
  },
  {
    title: "SMS / Text Message Communications",
    paragraphs: [
      <>If you provide your mobile telephone number and affirmatively consent to receive text messages, HELOC Connect and, where applicable, our matched lending partners may send you SMS messages related to your inquiry, including confirmation of receipt and status updates.</>
    ],
    bullets: [
      <>Message frequency varies and is based on the status of your inquiry.</>,
      <>Message and data rates may apply, as determined by your mobile carrier.</>,
      <>You may opt out at any time by replying STOP to any message received.</>,
      <>For assistance, reply HELP or contact us using the information below.</>,
      <>Consent to receive SMS communications is not required as a condition of using the Service or obtaining any loan product and may be withdrawn at any time.</>
    ]
  },
  {
    title: "Your Privacy Rights",
    paragraphs: [
      <><strong className="text-white">California Residents.</strong> If you are a California resident, you may have rights under the California Consumer Privacy Act, as amended by the California Privacy Rights Act, including the right to know, request deletion or correction, opt out of sale or sharing where applicable, and not be discriminated against for exercising applicable rights.</>,
      <>To exercise a privacy right, contact us at clientservices@helocconnect.com or (949) 866-2466. We may need to verify your identity before completing a request.</>,
      <><strong className="text-white">Other Jurisdictions.</strong> Residents of other states or jurisdictions with applicable privacy laws may have similar rights. We will honor valid requests to the extent required by law.</>
    ]
  },
  {
    title: "Data Security",
    paragraphs: [
      <>We implement reasonable administrative, technical, and physical safeguards designed to protect personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.</>
    ]
  },
  {
    title: "Data Retention",
    paragraphs: [
      <>We retain personal information for as long as reasonably necessary to fulfill the purposes described in this Policy, provide the Service, comply with legal and regulatory recordkeeping obligations, resolve disputes, enforce agreements, and maintain records of SMS consent where required.</>
    ]
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      <>The Service is intended for individuals who are at least eighteen (18) years of age. We do not knowingly collect personal information from individuals under 18. If we become aware that we collected such information, we will take reasonable steps to delete it.</>
    ]
  },
  {
    title: "Contact Us",
    paragraphs: [
      <>Questions, concerns, or privacy requests may be directed to HELOC Connect at <a className="font-black text-amber-200" href="mailto:clientservices@helocconnect.com">clientservices@helocconnect.com</a> or <a className="font-black text-amber-200" href="tel:9498662466">(949) 866-2466</a>.</>
    ]
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      <>We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. The revised version will be identified by the “Last Updated” date shown above. We encourage you to review this Policy periodically.</>
    ]
  }
];

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Privacy & Data Use"
      title="Privacy Policy"
      intro={<>This Privacy Policy describes how HELOC Connect collects, uses, discloses, and safeguards information in connection with helocconnect.com and related services, tools, portals, and features. By using the Service, you acknowledge that you have read and understood this Policy.</>}
      sections={sections}
    />
  );
}
