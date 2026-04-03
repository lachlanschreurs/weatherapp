import { X, Mail, Copy, CheckCircle, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EmailImportInstructionsProps {
  onClose: () => void;
}

export function EmailImportInstructions({ onClose }: EmailImportInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  async function loadUserInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const shortenedId = user.id.substring(0, 12);
      setEmailAddress(`probe-${shortenedId}@farmcast.app`);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Email Import Setup</h2>
              <p className="text-sm text-green-100 mt-1">Forward probe reports directly to Farmcast</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How Email Import Works</p>
              <p>Many moisture probe systems can email you regular reports. Forward those emails to your unique Farmcast address and we'll automatically extract and import the data.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Your Unique Email Address</h3>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm">
                {emailAddress || 'Loading...'}
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                disabled={!emailAddress}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Setup Instructions</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Copy your email address</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Click the "Copy" button above to copy your unique Farmcast email address.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Configure your probe system</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Log in to your moisture probe provider's website or app. Look for email notification or report settings.
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 ml-4 space-y-1">
                    <li>• Add your Farmcast email as a recipient</li>
                    <li>• Set up daily or weekly reports</li>
                    <li>• Ensure reports include moisture data in the email body or as CSV attachments</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Test the connection</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Send a test email or wait for your first scheduled report. Data will appear automatically in Farmcast once received.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Supported Formats</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>CSV attachments with moisture, temperature, and timestamp data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Plain text emails with structured data tables</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>HTML emails with data in table format</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> Email import is currently in beta. If you encounter issues with your specific probe provider's email format, please contact support and we'll add compatibility.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
