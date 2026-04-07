import { useState } from "react";
import { Search, MessageSquare, Mail, Phone, Book, Video, ChevronDown, ChevronUp } from "lucide-react";

/**
 * A responsive help and support page component.
 * @param {{ theme: string }} props
 */
export default function Help({ theme }) {
  const isDark = theme === "dark";

  // State to manage which FAQ item is open
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I add a new user?",
      answer: "Navigate to the 'Settings' page under 'User Management'. Click on the '+ Add User' button and fill in the required details.",
    },
    {
      id: 2,
      question: "Can I customize my dashboard view?",
      answer: "While the main dashboard layout is fixed, you can filter data by date range and other options on the 'Reports & Analytics' page to customize your view.",
    },
    {
      id: 3,
      question: "Where can I find my invoices?",
      answer: "Invoices and financial reports can be generated from the 'Reports & Analytics' page by selecting the 'Financial Statement' template.",
    },
    {
      id: 4,
      question: "How do I reset my password?",
      answer: "You can reset your password from the 'My Profile' section within the 'Settings' page. An email will be sent to you with further instructions.",
    },
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div
      className={`p-4 md:p-6 min-h-screen transition-colors ${
        isDark ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header section */}
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Help & Support</h1>
      <p className="text-sm md:text-base mb-6">Find answers to your questions and get in touch with our team.</p>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column: Search and FAQs */}
        <div className="lg:col-span-2">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Search for help topics..."
              className={`w-full pl-10 pr-3 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* Quick Links / Getting Started */}
          <div className={`rounded-lg shadow-sm p-6 mb-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Here are some quick links to help you get up and running.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className={`flex items-center justify-center p-4 rounded-lg transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}>
                <Book className="h-5 w-5 mr-2" />
                <span className="font-medium text-sm">View Documentation</span>
              </button>
              <button className={`flex items-center justify-center p-4 rounded-lg transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}>
                <Video className="h-5 w-5 mr-2" />
                <span className="font-medium text-sm">Watch Video Guides</span>
              </button>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className={`rounded-lg shadow-sm p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl font-semibold mb-4">FAQs</h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqs.map((faq) => (
                <div key={faq.id} className="py-4">
                  <button
                    className="flex justify-between items-center w-full text-left font-medium text-base hover:text-blue-500"
                    onClick={() => toggleFAQ(faq.id)}
                  >
                    {faq.question}
                    {openFAQ === faq.id ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  <div
                    className={`mt-2 transition-all duration-300 ease-in-out overflow-hidden ${
                      openFAQ === faq.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Support */}
        <div>
          <div className={`rounded-lg shadow-sm p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
            <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="space-y-4">
              <div className={`flex items-center p-4 rounded-lg transition-colors ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                <Mail className="h-6 w-6 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <a href="mailto:support@yourcompany.com" className={`text-sm hover:underline ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    support@yourcompany.com
                  </a>
                </div>
              </div>
              <div className={`flex items-center p-4 rounded-lg transition-colors ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                <Phone className="h-6 w-6 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Call Us</p>
                  <a href="tel:+18001234567" className={`text-sm hover:underline ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    +1 (800) 123-4567
                  </a>
                </div>
              </div>
              <button className="flex items-center justify-center w-full p-4 rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700">
                <MessageSquare className="h-5 w-5 mr-2" />
                <span className="font-medium">Start a Live Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
