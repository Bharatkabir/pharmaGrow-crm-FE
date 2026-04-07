import { useState } from "react";
import { Check, Star, Zap, Crown } from "lucide-react";

/**
 * A responsive subscription and add-ons page component.
 * It's designed to adapt to various screen sizes.
 *
 * @param {{ theme: string }} props
 */
export default function Subscription({ theme }) {
  const [currentPlan, setCurrentPlan] = useState("Professional");
  const isDark = theme === "dark";

  // Plan data
  const plans = [
    {
      name: "Basic",
      price: "29",
      period: "month",
      description: "Perfect for small pharmacies and clinics",
      icon: <Star className="h-10 w-10 text-gray-500" />,
      features: [
        "Up to 100 customers",
        "Basic inventory management",
        "Standard invoicing",
        "Email support",
        "5GB storage",
      ],
      isCurrent: false,
    },
    {
      name: "Professional",
      price: "79",
      period: "month",
      description: "Ideal for growing healthcare businesses",
      icon: <Zap className="h-10 w-10 text-blue-600" />,
      features: [
        "Up to 1,000 customers",
        "Advanced inventory tracking",
        "E-invoicing integration",
        "Priority support",
        "50GB storage",
        "Custom reports",
      ],
      isCurrent: true,
      isPopular: true,
    },
    {
      name: "Enterprise",
      price: "199",
      period: "month",
      description: "For large hospitals and healthcare networks",
      icon: <Crown className="h-10 w-10 text-gray-500" />,
      features: [
        "Unlimited customers",
        "Real-time inventory sync",
        "Advanced e-invoicing",
        "24/7 dedicated support",
        "Unlimited storage",
        "Custom integrations",
        "Multi-location support",
      ],
      isCurrent: false,
    },
  ];

  // Add-on data
  const addOns = [
    {
      name: "E-invoicing Pro",
      price: "19",
      period: "month",
      description: "Advanced e-invoicing with automated reminders and payment tracking",
      status: "Active",
    },
    {
      name: "Mobile Sales App",
      price: "15",
      period: "month",
      description: "Field sales team app with real-time sync and offline capabilities",
      status: "Available",
    },
    {
      name: "Advanced Analytics",
      price: "25",
      period: "month",
      description: "Detailed business intelligence and predictive analytics",
      status: "Available",
    },
    {
      name: "Multi-language Support",
      price: "10",
      period: "month",
      description: "Support for multiple languages and regional settings",
      status: "Available",
    },
  ];

  return (
    <div className={`p-6 transition-colors duration-300 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Choose Your Plan</h1>
        <p className={`mt-2 max-w-2xl mx-auto text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Select the perfect plan for your healthcare business. All plans include core CRM functionality
          with the ability to add specialized features as your business grows.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className={`border rounded-lg shadow-sm p-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center ${
        isDark ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200"
      }`}>
        <div>
          <h2 className="text-xl font-bold">Current Plan: {currentPlan}</h2>
          <p className={`mt-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Your plan renews on February 20, 2024
          </p>
          <div className={`w-full rounded-full h-2.5 mt-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "65%" }}></div>
          </div>
          <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            650/1,000 customers used
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <p className="text-3xl font-bold">
            $79<span className={`text-sm font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}>/month</span>
          </p>
          <button className={`mt-2 px-4 py-2 rounded-lg border transition-colors ${
            isDark ? "bg-gray-800 text-blue-400 border-blue-500 hover:bg-gray-700" : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
          }`}>
            Manage Plan
          </button>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg shadow-lg p-6 flex flex-col relative transition-colors ${
              isDark
                ? `bg-gray-800 border ${plan.isPopular ? "border-blue-500" : "border-gray-700"}`
                : `bg-white ${plan.isPopular ? "border-2 border-blue-600" : "border border-gray-200"}`
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  plan.isPopular ? "bg-blue-100" : "bg-gray-100"
                }`}>
                {plan.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">${plan.price}<span className="text-sm font-normal text-gray-500">/{plan.period}</span></p>
              <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{plan.description}</p>
            </div>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {plan.isCurrent ? (
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center">
                  Current Plan
                </button>
              ) : (
                <button className={`w-full py-3 rounded-lg shadow-sm transition-colors ${
                  isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-900 text-white hover:bg-gray-800"
                }`}>
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons Section */}
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Add-ons & Extensions</h2>
        <p className={`mt-2 text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>Enhance your CRM with specialized features</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {addOns.map((addOn, index) => (
            <div
              key={index}
              className={`rounded-lg shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold">{addOn.name}</h3>
                <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{addOn.description}</p>
                <div className="mt-2 text-sm">
                  {addOn.status === "Active" ? (
                    <span className="text-green-600 font-semibold">{addOn.status}</span>
                  ) : (
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>{addOn.status}</span>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0">
                <p className="text-lg font-bold">
                  ${addOn.price}<span className={`text-sm font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}>/{addOn.period}</span>
                </p>
                {addOn.status === "Active" ? (
                  <button className={`mt-2 px-4 py-2 rounded-lg transition-colors ${
                    isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}>
                    Active
                  </button>
                ) : (
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add to Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
