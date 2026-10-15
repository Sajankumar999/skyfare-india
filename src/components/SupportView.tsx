import React, { useState } from 'react';
import {
  HelpCircle,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Code,
  Landmark,
  Building2,
  ChevronDown,
  ExternalLink,
  Users,
  Compass
} from 'lucide-react';

export const SupportView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does SkyFare India determine if an airfare is a "Surge" or "Fair-Fare"?',
      a: 'SkyFare computes a 30-day moving median baseline for every monitored domestic corridor and advance-booking horizon. If a quoted fare exceeds the historical median by 15% or more, it is flagged as an algorithmic surge. Fares priced 5% or more below the baseline are designated as "Fair-Fare / Below Normal".',
    },
    {
      q: 'What is DGCA Rule 135 and how does it protect air passengers in India?',
      a: 'Rule 135 of the Aircraft Rules 1937 mandates that every air transport undertaking establish reasonable tariffs having regard to all relevant factors, including the cost of operation, characteristics of service, reasonable profit, and prevailing tariff levels. It prohibits predatory pricing and requires unbundled transparency for fuel surcharges and statutory airport taxes.',
    },
    {
      q: 'Why does SkyFare advise "Buy Now" vs. "Wait"?',
      a: 'Our empirical yield curve model analyzes lead-time escalation patterns across thousands of historical quotes. For flights within 7 days (T+1 to T+7), prices almost never decrease, prompting an urgent "Buy Now". For bookings 30+ days out (T+30 or T+45) with price tags above normal, the engine advises "Wait" as seat batches often open at lower promotional buckets.',
    },
    {
      q: 'Where do the daily airfare quotes come from?',
      a: 'Data is ingested 24/7 across airline direct NDC APIs (IndiGo, Air India) and major online travel aggregators (OTAs) with cryptographic SHA-256 Merkle proofs to ensure zero tampering before computation into the National Airfare Index.',
    },
    {
      q: 'How can I file a formal grievance if an airline charges unreasonable cancellation fees or surge fares?',
      a: 'Passengers can file complaints directly through the Ministry of Civil Aviation AirSewa portal (airsewa.gov.in) or call the National Consumer Helpline at 1915. If the dispute involves unfair tariff practices under Rule 135, you can also escalate to the DGCA Tariff Directorate.',
    },
  ];

  return (
    <div className="space-y-6 pb-16 animate-fadeIn max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
            Citizen Charter & Assistance
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Dual Redressal for Citizens & Government
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Citizen Support & Grievance Redressal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Know your rights under DGCA Passenger Charter and access direct statutory grievance and policy inquiry channels
        </p>
      </div>

      {/* Dual User Base Grid: 6 Support Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            Statutory Portals, Grievance Lines & Policy Cells
          </span>
          <span className="font-mono text-[10px] hidden sm:inline">6 Dedicated Channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: AirSewa Portal (MoCA) */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between gap-3 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 uppercase tracking-wider">
                  Citizen • Flight Ops
                </span>
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                AirSewa Portal (MoCA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Unified portal for flight delays and airline operational complaints.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Official Portal</span>
              <a
                href="https://airsewa.gov.in"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>airsewa.gov.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Card 2: DGCA Tariff Regulation Cell */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all flex flex-col justify-between gap-3 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 uppercase tracking-wider">
                  Regulatory • Rule 135
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                DGCA Tariff Regulation Cell
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Report violations of Rule 135 (predatory surge pricing) and illegal tax unbundling.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  Email
                </span>
                <a
                  href="mailto:sugam.dgca@nic.in"
                  className="font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-[11px]"
                >
                  sugam.dgca@nic.in
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Phone
                </span>
                <a
                  href="tel:+911124622495"
                  className="font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline text-[11px]"
                >
                  +91-11-24622495
                </a>
              </div>
            </div>
          </div>

          {/* Card 3: National Consumer Helpline */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 uppercase tracking-wider">
                  Citizen • Grievance
                </span>
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                National Consumer Helpline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Report hidden convenience fees or refund disputes with Online Travel Aggregators (OTAs).
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Toll-Free Helpline</span>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                  1915 or 1800-11-4000
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Grievance Portal</span>
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>consumerhelpline.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Card 4: MoSPI Price Statistics Division */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 uppercase tracking-wider">
                  Government • Economists
                </span>
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                MoSPI Price Statistics Division
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Inquiries regarding APIx index methodology, Base Year (2024=100) calculations, and CPI basket weights.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  Official Email
                </span>
                <a
                  href="mailto:cpi-aviation@mospi.gov.in"
                  className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
                >
                  cpi-aviation@mospi.gov.in
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  Web Division
                </span>
                <a
                  href="https://mospi.gov.in/cpi"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>mospi.gov.in/cpi</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Card 5: RBI Monetary Policy Committee */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 uppercase tracking-wider">
                  Government • Central Bank
                </span>
                <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                RBI Monetary Policy Committee
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Information on how high-frequency airfare data informs inflation targeting and interest rate policy.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                MPC Secretariat
              </span>
              <a
                href="mailto:inflation.mpc@rbi.org.in"
                className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline text-[11px]"
              >
                inflation.mpc@rbi.org.in
              </a>
            </div>
          </div>

          {/* Card 6: SkyFare API & Technical Support */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-3 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 uppercase tracking-wider">
                  Developers • Integration
                </span>
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                SkyFare API & Technical Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Request REST API tokens, system integration keys, or report platform bugs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  Developer Desk
                </span>
                <a
                  href="mailto:api-support@skyfare.gov.in"
                  className="font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline text-[11px]"
                >
                  api-support@skyfare.gov.in
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  Dev Portal
                </span>
                <a
                  href="https://developer.skyfare.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>developer.skyfare.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DGCA Rule 135 Regulatory Rights Box (Preserved exactly as requested) */}
      <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-extrabold text-sm">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span>Statutory Protection: Aircraft Rules 1937 (Rule 135)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Unbundled Fee Disclosure:</span>
            <p>Airlines are legally required to display the explicit breakdown of Basic Airfare, Fuel Surcharge, User Development Fee (UDF), and Passenger Service Fee (PSF).</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Cap on Predatory Surges:</span>
            <p>Under Section 5A of Aircraft Act 1934, the Central Government retains statutory powers to impose upper tariff caps during emergencies, natural disasters, or severe market disruptions.</p>
          </div>
        </div>
      </div>

      {/* FAQs Accordion (Preserved exactly as requested) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="pt-3">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-1 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
