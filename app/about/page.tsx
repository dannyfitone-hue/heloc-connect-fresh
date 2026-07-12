import LegalShell from "@/components/LegalShell";

const sections = [
  {
    title: "Why We Built HELOC Connect",
    paragraphs: [
      <>It started with a simple, frustrating realization: getting a HELOC or refinance is confusing, and when you need money quickly, that confusion has a real cost. Homeowners can fall into the first lender that says yes, accept rates that are higher than they should be, and discover only years later that they paid thousands of dollars more than necessary.</>,
      <>When homeowners think about refinancing, many go directly back to the company that already holds their mortgage. It feels obvious, but a mortgage should be compared like any other major purchase. Some lenders are simply better suited than others. Most homeowners do not have the time, experience, or market knowledge to find them.</>
    ]
  },
  {
    title: "The Gap We Fill",
    paragraphs: [
      <><strong className="text-white">That is the gap HELOC Connect fills.</strong> You tell us what you need. We do the shopping across our network and work to match you with the lender best suited to your actual situation, not merely the first company to answer the phone.</>
    ]
  },
  {
    title: "More Than Convenience",
    paragraphs: [
      <>Our process is designed to save time and help protect consumers from applying separately with one company after another. Repeated applications can create repeated credit-related conversations and unnecessary friction. By helping organize the first step and route your request, HELOC Connect gives you a clearer, more focused path.</>
    ]
  },
  {
    title: "Your Personal Portal",
    paragraphs: [
      <>Once you submit your information, you are not left wondering what happens next. Your personal client portal provides a simple place to view your current status, access updates, and respond to document requests as your inquiry moves forward.</>
    ]
  },
  {
    title: "A VIP Experience",
    paragraphs: [
      <><strong className="text-white">Think of us as the lounge on your way to the right mortgage company</strong> — a calm, private space designed around you, not a waiting room. Whether you are accessing a small amount of equity or a significant one, every client is treated like a VIP because that is exactly what you are.</>
    ]
  },
  {
    title: "Our Role",
    paragraphs: [
      <>HELOC Connect is a matching and connection platform, not a lender or mortgage company. Participating lenders independently determine eligibility, rates, fees, terms, documentation, underwriting, and funding. Homeowners pay HELOC Connect $0 to use the matching service; participating companies may compensate HELOC Connect for technology, marketing, or connection services.</>
    ]
  },
  {
    title: "Contact Us",
    paragraphs: [
      <>Have a question before getting started? Reach out at <a className="font-black text-amber-200" href="mailto:clientservices@helocconnect.com">clientservices@helocconnect.com</a> or <a className="font-black text-amber-200" href="tel:9498662466">(949) 866-2466</a>. We would rather answer your question now than have you discover the answer the hard way later.</>
    ]
  }
];

export default function AboutPage() {
  return (
    <LegalShell
      eyebrow="Why We Exist"
      title="About HELOC CONNECT"
      intro={<>A consumer-focused platform built to make exploring HELOC, refinance, and home-purchase options clearer, faster, and more comfortable.</>}
      sections={sections}
    />
  );
}
