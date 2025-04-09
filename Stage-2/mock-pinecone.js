// Mock Pinecone service for testing
const mockProposals = [
  {
    "recommendedFreeZone": "Dubai Multi Commodities Centre (DMCC)",
    "whyRecommended": "Perfect for trading activities with a prestigious location and global network",
    "keyBenefits": [
      "100% foreign ownership",
      "No corporate or personal taxes",
      "Strategic location in JLT",
      "Global network of businesses"
    ],
    "featuresAndAttributes": {
      "maximumActivities": "Multiple",
      "maximumVisas": "Based on office space",
      "minimumShareholders": "1",
      "maximumShareholders": "50",
      "minimumDirectors": "1",
      "maximumDirectors": "No limit",
      "companySecretaryRequired": "Yes",
      "corporateSecretaryAllowed": "Yes",
      "corporateDirectorsAllowed": "Yes"
    },
    "costBreakdown": {
      "licenseSetupFee": 15000,
      "licenseRenewalFee": 12000,
      "visaFees": 3000,
      "officeCost": 5000,
      "otherFees": 2000,
      "total": 25000
    },
    "setupProcess": [
      "Apply for company registration",
      "Submit required documents",
      "Pay registration fees",
      "Receive initial approval",
      "Sign legal documents",
      "Receive trade license"
    ]
  },
  {
    "recommendedFreeZone": "Dubai Internet City (DIC)",
    "whyRecommended": "Ideal for tech and IT-related businesses with a strong innovation ecosystem",
    "keyBenefits": [
      "Tech-focused business environment",
      "Access to industry events and networking",
      "Modern infrastructure and facilities",
      "Close proximity to tech giants"
    ],
    "featuresAndAttributes": {
      "maximumActivities": "Related to technology",
      "maximumVisas": "Based on office space",
      "minimumShareholders": "1",
      "maximumShareholders": "No limit",
      "minimumDirectors": "1",
      "maximumDirectors": "No limit",
      "companySecretaryRequired": "No",
      "corporateSecretaryAllowed": "Yes",
      "corporateDirectorsAllowed": "Yes"
    },
    "costBreakdown": {
      "licenseSetupFee": 20000,
      "licenseRenewalFee": 15000,
      "visaFees": 3500,
      "officeCost": 8000,
      "otherFees": 2500,
      "total": 34000
    },
    "setupProcess": [
      "Submit application form",
      "Get initial approval",
      "Pay registration fees",
      "Submit additional documents",
      "Sign lease agreement",
      "Receive trade license"
    ]
  },
  {
    "recommendedFreeZone": "Sharjah Media City (Shams)",
    "whyRecommended": "Cost-effective option with flexible visa allocation and minimal requirements",
    "keyBenefits": [
      "Low setup and renewal costs",
      "Flexible visa options",
      "Multiple business activities allowed",
      "Simple and fast setup process"
    ],
    "featuresAndAttributes": {
      "maximumActivities": "Multiple",
      "maximumVisas": "Flexible allocation",
      "minimumShareholders": "1",
      "maximumShareholders": "No limit",
      "minimumDirectors": "1",
      "maximumDirectors": "No limit",
      "companySecretaryRequired": "No",
      "corporateSecretaryAllowed": "Yes",
      "corporateDirectorsAllowed": "No"
    },
    "costBreakdown": {
      "licenseSetupFee": 8000,
      "licenseRenewalFee": 7000,
      "visaFees": 2500,
      "officeCost": 3000,
      "otherFees": 1500,
      "total": 15000
    },
    "setupProcess": [
      "Apply online",
      "Submit documentation",
      "Pay registration fees",
      "Receive electronic approval",
      "Collect trade license"
    ]
  },
  {
    "recommendedFreeZone": "Ajman Free Zone",
    "whyRecommended": "Most economical option with good visa allocation and minimal capital requirements",
    "keyBenefits": [
      "Low cost setup and renewal",
      "Generous visa quota",
      "No minimum capital requirement",
      "Quick and simple registration"
    ],
    "featuresAndAttributes": {
      "maximumActivities": "Multiple",
      "maximumVisas": "Up to 6 with virtual office",
      "minimumShareholders": "1",
      "maximumShareholders": "5",
      "minimumDirectors": "1",
      "maximumDirectors": "5",
      "companySecretaryRequired": "No",
      "corporateSecretaryAllowed": "No",
      "corporateDirectorsAllowed": "No"
    },
    "costBreakdown": {
      "licenseSetupFee": 6000,
      "licenseRenewalFee": 5500,
      "visaFees": 2000,
      "officeCost": 2500,
      "otherFees": 1000,
      "total": 11500
    },
    "setupProcess": [
      "Submit application",
      "Get initial approval",
      "Pay license fees",
      "Sign documents",
      "Receive trade license"
    ]
  }
];

// Function to provide mock proposal data for testing
function getMockProposalData() {
  return {
    proposals: mockProposals,
    userData: {
      fullName: "Test User",
      email: "test@example.com",
      phoneNumber: "+1234567890",
      businessCategory: "professional",
      officeSpace: ["Virtual office"],
      businessActivity: "Advertising",
      shareholders: "1-2",
      visas: "2-5"
    }
  };
}

module.exports = { getMockProposalData }; 