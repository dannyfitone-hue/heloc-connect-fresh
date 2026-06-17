"use client";

export default function DeleteLeadForm({ leadId }: { leadId: string }) {
  return (
    <form
      action="/api/owner/delete-lead"
      method="post"
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this lead? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <button className="w-full rounded-2xl border border-red-400/35 bg-red-500/10 p-3 font-black text-red-200">Delete Lead</button>
    </form>
  );
}
