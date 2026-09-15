import Link from "next/link";
import { Icon } from "@/components/Icons";
import type { AssistantConfig } from "@/lib/assistant";
import type { Business } from "@/lib/types";

export default function WorkflowAgents({ business, config }: { business: Business; config: AssistantConfig }) {
  const agents = [
    {
      name: "Accuracy Guard",
      detail: "Confirms names, phone numbers, addresses, dates, and times before closing.",
      active: config.confirm_critical_details,
      href: "#accuracy",
    },
    {
      name: "Booking Agent",
      detail: "Checks live availability and writes confirmed appointments to Google Calendar.",
      active: config.offer_slots,
      href: "/appointments",
    },
    {
      name: "Human Handoff",
      detail: "Transfers urgent or uncertain calls to the owner's verified number.",
      active: config.transfer_when_uncertain && Boolean(business.forward_to),
      href: "/settings#phone",
    },
  ];

  return (
    <section className="rounded-2xl border border-arc-400/25 bg-gradient-to-r from-ink-850 to-ink-900 p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-arc-200"><Icon name="bot" size={18} /></span>
        <div>
          <h2 className="text-section text-ink-50">Receptionist automation layer</h2>
          <p className="text-caption text-ink-300">Three focused agents keep every call accurate and move requests forward automatically.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <Link key={agent.name} href={agent.href} className="rounded-xl border border-edge bg-ink-950/50 p-3.5 hover:border-edge-strong transition-colors">
            <div className="flex items-center justify-between gap-2">
              <p className="text-card-title text-ink-50">{agent.name}</p>
              <span className={`text-overline uppercase rounded-full border px-2 py-0.5 ${agent.active ? "text-good-300 border-good-400/25 bg-good-400/10" : "text-warn-300 border-warn-400/25 bg-warn-400/10"}`}>
                {agent.active ? "Active" : "Setup"}
              </span>
            </div>
            <p className="text-caption text-ink-300 mt-1.5">{agent.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
