import LegalShell from "@/components/LegalShell";

const sections = [
  {
    title: "Description of Service",
    paragraphs: [
      <>HELOC Connect is a matching platform that connects homeowners with third-party mortgage lenders and lending partners in our network for HELOC, refinance, home-purchase, and related home-financing products. <strong className="text-white">HELOC Connect is not a lender.</strong> We do not make credit decisions, extend loan offers, underwrite loans, or guarantee approval, rates, or terms. All loan decisions, terms, and approvals are made solely by the third-party lender with whom you are matched.</>
    ]
  },
  {
    title: "No Cost to Homeowners",
    paragraphs: [
      <>There is no cost to homeowners for using HELOC Connect's matching service. HELOC Connect is compensated by participating mortgage companies and lending partners in our network, not by consumers using the Service.</>
    ]
  },
  {
    title: "Eligibility",
    paragraphs: [
      <>You must be at least 18 years of age and a legal resident of the United States to use this Service. By using the Service, you represent and warrant that you meet these requirements.</>
    ]
  },
  {
    title: "Accuracy of Information",
    paragraphs: [
      <>You agree to provide accurate, current, and complete information when using the Service, including property, financial, and contact information. False or misleading information may affect your ability to be matched and may result in suspension or termination of access.</>
    ]
  },
  {
    title: "No Guarantee of Outcome",
    paragraphs: [
      <>We make no representation or warranty that you will be approved for any loan product, that any particular rate or term will be offered, or that any match will result in a completed transaction. Calculator estimates, including estimated equity, payment amounts, property value, or cash availability, are for informational purposes only and do not constitute an offer of credit or guarantee. Final terms are determined solely by the third-party lender.</>
    ]
  },
  {
    title: "Communications Consent",
    paragraphs: [
      <>By submitting your information through the Service, you consent to be contacted by HELOC Connect and/or matched lending partners by phone, email, and SMS text message at the contact information you provide, including through automated technology, for purposes related to your inquiry. You may withdraw consent as described in our Privacy Policy. Standard message and data rates may apply.</>
    ]
  },
  {
    title: "Third-Party Lenders",
    paragraphs: [
      <>HELOC Connect is not responsible for the actions, representations, terms, conduct, or omissions of any third-party lender or mortgage company with whom you are matched. Any agreement, loan, or transaction is solely between you and that lender and is governed by the lender's own terms, disclosures, licenses, and policies.</>
    ]
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      <>All content on the Service, including text, graphics, logos, mascot, calculator tools, design, and software, is the property of HELOC Connect or its licensors and is protected by applicable intellectual-property laws. You may not copy, reproduce, distribute, scrape, or create derivative works without prior written consent.</>
    ]
  },
  {
    title: "Prohibited Conduct",
    bullets: [
      <>Providing false or fraudulent information.</>,
      <>Attempting to interfere with, disrupt, probe, or gain unauthorized access to the Service or its systems.</>,
      <>Using the Service for an unlawful purpose.</>,
      <>Using automated means to access, scrape, or extract content or data without written permission.</>
    ]
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      <>To the fullest extent permitted by law, HELOC Connect and its officers, employees, affiliates, and service providers shall not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from or related to use of the Service, including loan terms, rates, denials, lender conduct, delayed communications, or reliance on automated estimates.</>
    ]
  },
  {
    title: "Disclaimer of Warranties",
    paragraphs: [
      <>The Service, including calculator tools and estimates, is provided “as is” and “as available” without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted or error-free or that any estimate will reflect actual loan terms available to you.</>
    ]
  },
  {
    title: "Indemnification",
    paragraphs: [
      <>You agree to indemnify and hold harmless HELOC Connect and its officers, employees, affiliates, and service providers from claims, damages, losses, liabilities, or expenses, including reasonable attorneys' fees, arising from your use of the Service, your violation of these Terms, or your submission of false or misleading information.</>
    ]
  },
  {
    title: "Dispute Resolution",
    paragraphs: [
      <>HELOC Connect is committed to resolving concerns fairly and efficiently. Before initiating a legal proceeding, you agree to contact HELOC Connect in writing and make a good-faith effort to resolve any dispute, claim, or concern arising from or relating to the Service or these Terms.</>,
      <>If the parties are unable to resolve the matter through informal discussions within thirty (30) days after written notice is provided, either party may pursue rights and remedies available under applicable law.</>,
      <>Unless otherwise required by applicable law, any legal action or proceeding arising out of or relating to these Terms or the Service shall be brought exclusively in the state or federal courts located in California. You consent to the personal jurisdiction of those courts and waive objections based on improper venue or forum non conveniens.</>,
      <>Nothing in these Terms limits either party's right to seek temporary or preliminary injunctive relief where reasonably necessary to protect its rights while a dispute is being resolved.</>
    ]
  },
  {
    title: "Governing Law",
    paragraphs: [
      <>These Terms are governed by and construed in accordance with the laws of the State of California and applicable United States federal law, without regard to conflict-of-law principles.</>
    ]
  },
  {
    title: "Severability",
    paragraphs: [
      <>If any provision of these Terms is found unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</>
    ]
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      <>We may modify these Terms from time to time. Material changes will be reflected by a revised “Last Updated” date. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</>
    ]
  },
  {
    title: "Contact Us",
    paragraphs: [
      <>Questions about these Terms may be directed to HELOC Connect at <a className="font-black text-amber-200" href="mailto:clientservices@helocconnect.com">clientservices@helocconnect.com</a> or <a className="font-black text-amber-200" href="tel:9498662466">(949) 866-2466</a>.</>
    ]
  }
];

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Website Use & Disclosures"
      title="Terms & Conditions"
      intro={<>Please read these Terms carefully before using helocconnect.com and related services. By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you should not use the Service.</>}
      sections={sections}
    />
  );
}
