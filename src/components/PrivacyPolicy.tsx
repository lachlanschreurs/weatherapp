import { X, Shield } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const sections = [
  {
    title: '1. Information We Collect',
    body: 'FarmCast may collect basic account information including name, email address, location, subscription details, and user preferences when you sign up or use the platform.',
  },
  {
    title: '2. How We Use Information',
    body: null,
    list: [
      'Deliver local weather forecasts',
      'Send daily farm reports and alerts',
      'Manage subscriptions',
      'Improve platform performance',
      'Provide agronomy support features',
    ],
    listIntro: 'Collected information is used to:',
  },
  {
    title: '3. Data Security',
    body: 'FarmCast uses secure cloud-based systems and industry-standard protections to store account and subscription data.',
  },
  {
    title: '4. Sharing of Information',
    body: 'FarmCast does not sell personal information. Information may only be used with trusted service providers required for platform operation such as payment processing, hosting, and email delivery.',
  },
  {
    title: '5. Cookies and Analytics',
    body: 'FarmCast may use cookies and analytics tools to improve user experience and understand platform performance.',
  },
  {
    title: '6. User Responsibility',
    body: 'Users are responsible for maintaining account security and protecting login details.',
  },
  {
    title: '7. Forecast and Agronomy Disclaimer',
    body: 'FarmCast provides guidance only. Weather forecasts, agronomy recommendations, spray advice, and farm insights should always be used alongside local judgement, product labels, and professional agronomic advice.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'FarmCast may update this Privacy Policy as the platform develops.',
  },
];

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-8">
      <div className="relative w-full max-w-2xl my-8 rounded-2xl border border-slate-700/40 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-700/40 bg-slate-900/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-700/30 border border-green-600/30">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-200">FarmCast Weather Privacy Policy</h2>
            <p className="text-xs text-slate-500">Effective Date: April 2026</p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            FarmCast Weather values your privacy and is committed to protecting your personal information.
          </p>

          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.title} className="rounded-xl border border-slate-700/30 bg-slate-800/40 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-200">{section.title}</h3>
                {section.listIntro && (
                  <p className="text-sm text-slate-400 leading-relaxed">{section.listIntro}</p>
                )}
                {section.list ? (
                  <ul className="space-y-1.5 pl-1">
                    {section.list.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-400 leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500/60 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 leading-relaxed">{section.body}</p>
                )}
              </div>
            ))}

            {/* Contact section */}
            <div className="rounded-xl border border-green-600/20 bg-green-950/20 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">9. Contact</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                For privacy questions contact:{' '}
                <a
                  href="mailto:support@farmcastweather.com"
                  className="text-green-400 underline hover:text-green-300 transition-colors"
                >
                  support@farmcastweather.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
