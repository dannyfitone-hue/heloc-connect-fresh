"use client";

export default function DeleteLenderForm({ lenderId, lenderEmail }: { lenderId: string; lenderEmail?: string }) {
  return (
    <form
      action="/api/owner/delete-lender"
      method="post"
      onSubmit={(e) => {
        if (!confirm(`Are you sure you want to delete this lender login${lenderEmail ? ` (${lenderEmail})` : ""}? Assigned leads will become unassigned.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="lenderId" value={lenderId} />
      <button className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200">
        Delete User Login
      </button>
    </form>
  );
}
