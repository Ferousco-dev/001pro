import React from "react";

interface LegalModalsProps {
  showTerms: boolean;
  setShowTerms: (val: boolean) => void;
  setAcceptTerms: (val: boolean) => void;
  isDarkMode: boolean;
  glassStyle: React.CSSProperties;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  showTerms,
  setShowTerms,
  setAcceptTerms,
  isDarkMode,
  glassStyle,
}) => {
  if (!showTerms) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowTerms(false)}
      />
      <div
        style={glassStyle}
        className={`relative max-w-lg w-full max-h-[80vh] rounded-3xl overflow-hidden ${
          isDarkMode
            ? "border border-white/[0.06]"
            : "border border-black/[0.06]"
        }`}
      >
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isDarkMode ? "border-neutral-800" : "border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Terms & Privacy
          </h3>
          <button
            onClick={() => setShowTerms(false)}
            className={`p-2 rounded-xl ${
              isDarkMode ? "hover:bg-black" : "hover:bg-gray-100"
            }`}
          >
            ✕
          </button>
        </div>
        <div
          className={`p-5 overflow-y-auto max-h-[60vh] text-sm space-y-4 ${
            isDarkMode ? "text-neutral-300" : "text-gray-600"
          }`}
        >
          <div>
            <h4
              className={`font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Terms of Service
            </h4>
            <p className="mb-3">
              By using AnonPro, you agree to use the platform responsibly and
              respectfully. You are solely responsible for maintaining the
              security of your account and password.
            </p>
            <p className="mb-3">
              You agree not to share illegal, harmful, or inappropriate content,
              harass other users, or violate any applicable laws or regulations.
            </p>
          </div>

          <div>
            <h4
              className={`font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Privacy Policy
            </h4>
            <p className="mb-3">
              We collect minimal personal information necessary for account
              creation and platform functionality. Email addresses are optional
              and used only for password recovery and important account
              notifications.
            </p>
            <p className="mb-3">
              Your data is stored securely and never shared with third parties
              without your explicit consent, except as required by law.
            </p>
            <p>
              You can request account deletion at any time, and we will remove
              your personal data within 30 days of your request.
            </p>
          </div>

          <div>
            <h4
              className={`font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Community Guidelines
            </h4>
            <p className="mb-3">
              AnonPro is built on principles of anonymity and free expression,
              but this does not extend to harmful behavior. We maintain a safe
              environment for all users.
            </p>
            <p>
              Violations of these guidelines may result in account suspension or
              permanent banning. We reserve the right to moderate content and
              accounts at our discretion.
            </p>
          </div>
        </div>
        <div
          className={`p-5 border-t ${
            isDarkMode ? "border-neutral-800" : "border-gray-200"
          }`}
        >
          <button
            onClick={() => {
              setAcceptTerms(true);
              setShowTerms(false);
            }}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
};
