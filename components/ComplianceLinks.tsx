export default function ComplianceLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Compliance and company information" className={className}>
      <a href="/privacy">Privacy</a>
      <span aria-hidden="true">•</span>
      <a href="/terms">Terms</a>
      <span aria-hidden="true">•</span>
      <a href="/about">About</a>
    </nav>
  );
}
