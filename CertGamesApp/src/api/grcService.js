// src/api/grcService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

let lastSuccessfulQuestion = null; // Cache a successful question as backup

// Fallback questions repository - 2 per category
const fallbackQuestions = {
  // Regulation category
  "Regulation": [
    {
      question: "Which regulatory approach is characterized by setting specific rules and requirements that organizations must follow exactly as stated?",
      options: [
        "Principles-based regulation",
        "Rules-based regulation",
        "Self-regulation",
        "Meta-regulation"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Principles-based regulation provides broad guidelines rather than specific rules. It focuses on outcomes rather than precise methods. The correct answer is rules-based regulation, which specifies exact requirements that must be followed.",
        "1": "Correct. Rules-based regulation sets specific, detailed requirements that organizations must follow exactly as written. This approach leaves little room for interpretation and focuses on strict compliance with explicit rules.",
        "2": "This is incorrect. Self-regulation involves industry participants creating and enforcing their own standards without significant government involvement. The correct answer is rules-based regulation, which involves authorities imposing specific requirements.",
        "3": "This is incorrect. Meta-regulation involves regulators overseeing an organization's own control and risk management systems. The correct answer is rules-based regulation, which directly specifies compliance requirements."
      },
      exam_tip: "Remember: Rules-based = specific, detailed requirements; Principles-based = broad guidelines focusing on outcomes."
    },
    {
      question: "Under the EU's General Data Protection Regulation (GDPR), what is the maximum fine for the most serious violations?",
      options: [
        "€10 million or 2% of global annual revenue, whichever is higher",
        "€20 million or 4% of global annual revenue, whichever is higher",
        "€5 million or 1% of global annual revenue, whichever is higher",
        "€50 million or 5% of global annual revenue, whichever is higher"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. €10 million or 2% of global annual revenue applies to less severe violations under GDPR. The correct answer is €20 million or 4% of global annual revenue for the most serious violations.",
        "1": "Correct. GDPR imposes fines up to €20 million or 4% of global annual revenue (whichever is higher) for the most serious violations, such as breaching data subject rights or international transfer requirements.",
        "2": "This is incorrect. GDPR does not specify a fine structure of €5 million or 1% of global annual revenue. The correct answer is €20 million or 4% of global annual revenue for the most serious violations.",
        "3": "This is incorrect. GDPR does not impose fines as high as €50 million or 5% of global annual revenue. The correct answer is €20 million or 4% of global annual revenue for the most serious violations."
      },
      exam_tip: "Remember the '4-2' rule for GDPR fines: 4% for serious violations, 2% for less serious ones."
    }
  ],
  
  // Risk Management category
  "Risk Management": [
    {
      question: "Which risk treatment option involves accepting the potential impact and probability of a risk without taking any action?",
      options: [
        "Risk mitigation",
        "Risk transfer",
        "Risk acceptance",
        "Risk avoidance"
      ],
      correct_answer_index: 2,
      explanations: {
        "0": "This is incorrect. Risk mitigation involves taking actions to reduce either the probability or impact of a risk, not accepting it without action. The correct answer is risk acceptance, which means acknowledging the risk but deciding not to act on it.",
        "1": "This is incorrect. Risk transfer involves shifting the burden of risk to another party, often through insurance or contracts. The correct answer is risk acceptance, which means acknowledging the risk but deciding not to act on it.",
        "2": "Correct. Risk acceptance involves acknowledging the potential impact and probability of a risk but deciding not to take any action to address it. This approach is typically used when the cost of mitigation exceeds the potential impact or when the risk has a very low likelihood.",
        "3": "This is incorrect. Risk avoidance involves eliminating the risk by removing the underlying cause or not engaging in the activity that creates the risk. The correct answer is risk acceptance, which involves acknowledging the risk but taking no action."
      },
      exam_tip: "Remember: Acceptance = Do nothing and live with it; Mitigation = Reduce it; Transfer = Give to someone else; Avoidance = Don't do the risky activity."
    },
    {
      question: "What type of risk is NOT typically factored into a quantitative risk assessment?",
      options: [
        "Reputational risk",
        "Operational risk",
        "Financial risk",
        "Compliance risk"
      ],
      correct_answer_index: 0,
      explanations: {
        "0": "Correct. Reputational risk is typically difficult to quantify in monetary terms and is often excluded from purely quantitative risk assessments. It refers to potential damage to an organization's brand or public image and is usually assessed using qualitative methods.",
        "1": "This is incorrect. Operational risks can be quantified through metrics like downtime costs, productivity losses, or repair expenses. The correct answer is reputational risk, which is more difficult to assign a precise monetary value.",
        "2": "This is incorrect. Financial risks are among the easiest risks to quantify with direct monetary values and are central to quantitative risk assessments. The correct answer is reputational risk, which is harder to value precisely.",
        "3": "This is incorrect. Compliance risks can be quantified through potential fines, penalties, and remediation costs. The correct answer is reputational risk, which cannot be easily expressed in monetary terms."
      },
      exam_tip: "If it can't be easily expressed in dollars and cents, it's likely a qualitative factor. Reputation is the classic example."
    }
  ],
  
  // Compliance category
  "Compliance": [
    {
      question: "Which compliance monitoring approach focuses on continuous tracking of metrics through automated tools rather than point-in-time assessments?",
      options: [
        "Periodic auditing",
        "Continuous compliance monitoring",
        "Retrospective review",
        "Annual certification"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Periodic auditing involves scheduled assessments at specific points in time, not continuous tracking. The correct answer is continuous compliance monitoring, which provides real-time or near-real-time visibility.",
        "1": "Correct. Continuous compliance monitoring involves tracking metrics and controls on an ongoing basis using automated tools and processes. This approach allows organizations to identify and address compliance issues more quickly than periodic assessments.",
        "2": "This is incorrect. Retrospective review looks backwards at past compliance after events have occurred, rather than monitoring continuously. The correct answer is continuous compliance monitoring, which provides real-time tracking.",
        "3": "This is incorrect. Annual certification is a point-in-time formal verification of compliance status, typically once per year. The correct answer is continuous compliance monitoring, which provides ongoing visibility."
      },
      exam_tip: "Continuous monitoring = real-time visibility through automation; Periodic = scheduled point-in-time checks."
    },
    {
      question: "Which of the following best describes the primary purpose of a compliance program?",
      options: [
        "To completely eliminate all regulatory and legal risks",
        "To establish a framework that helps prevent, detect, and address legal and regulatory violations",
        "To protect senior executives from personal liability",
        "To reduce the cost of doing business by minimizing penalties"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. No compliance program can completely eliminate all regulatory and legal risks - this is an unrealistic expectation. The correct answer is that compliance programs establish frameworks for prevention, detection, and addressing violations.",
        "1": "Correct. The primary purpose of a compliance program is to establish a framework that helps prevent, detect, and address violations of laws, regulations, and organizational policies. It helps manage risk rather than eliminate it entirely.",
        "2": "This is incorrect. While a robust compliance program may help protect executives, this is a secondary effect, not the primary purpose. The correct answer focuses on the broader organizational framework for managing compliance.",
        "3": "This is incorrect. While reducing penalties can be a benefit of compliance programs, it characterizes compliance as merely cost-avoidance rather than its primary purpose of establishing an effective framework. The correct answer is more comprehensive."
      },
      exam_tip: "The three pillars of compliance are: prevent, detect, and respond/address. Focus on the framework, not just the outcomes."
    }
  ],
  
  // Audit category
  "Audit": [
    {
      question: "Which of the following is NOT one of the primary objectives of an IT audit?",
      options: [
        "Evaluating the adequacy of internal controls",
        "Verifying compliance with regulations and standards",
        "Implementing security solutions",
        "Assessing the efficiency of IT operations"
      ],
      correct_answer_index: 2,
      explanations: {
        "0": "This is incorrect. Evaluating the adequacy of internal controls is a primary objective of IT audits to ensure that systems and data are properly protected. The correct answer is implementing security solutions, which is a management function, not an audit function.",
        "1": "This is incorrect. Verifying compliance with regulations and standards is a key objective of IT audits to ensure the organization meets legal and industry requirements. The correct answer is implementing security solutions, which is a management function.",
        "2": "Correct. Implementing security solutions is NOT an objective of an IT audit. Implementation is a management responsibility, while auditors maintain independence by evaluating and making recommendations rather than implementing solutions themselves.",
        "3": "This is incorrect. Assessing the efficiency of IT operations is a legitimate audit objective to identify waste and inefficiencies. The correct answer is implementing security solutions, which falls to management, not auditors."
      },
      exam_tip: "Auditors maintain independence by evaluating, advising, and reporting - they never implement the solutions they recommend."
    },
    {
      question: "In the context of audit evidence, what does 'appropriateness' refer to?",
      options: [
        "The quantity of evidence collected",
        "The relevance and reliability of the evidence",
        "The timeliness of evidence collection",
        "The cost-effectiveness of evidence gathering"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. The quantity of evidence relates to 'sufficiency,' not 'appropriateness.' The correct answer is that appropriateness refers to the relevance and reliability of evidence, addressing its quality rather than quantity.",
        "1": "Correct. Appropriateness of audit evidence refers to its relevance and reliability. Relevant evidence relates to the audit objectives, while reliable evidence is accurate, objective, and comes from trustworthy sources.",
        "2": "This is incorrect. While timeliness is important, it's not specifically what defines 'appropriateness' of audit evidence. The correct answer is the relevance and reliability of the evidence collected.",
        "3": "This is incorrect. Cost-effectiveness may influence the audit approach but doesn't define 'appropriateness' of evidence. The correct answer is the relevance and reliability of the evidence collected."
      },
      exam_tip: "Remember: Sufficiency = quantity of evidence; Appropriateness = quality (relevance + reliability)."
    }
  ],
  
  // Governance category
  "Governance": [
    {
      question: "In IT governance, what is the primary purpose of segregation of duties?",
      options: [
        "To reduce operational costs by specializing job functions",
        "To prevent errors and fraud by dividing critical functions",
        "To increase employee satisfaction through job rotation",
        "To comply with technical certification requirements"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. While specialization can improve efficiency, reducing operational costs is not the primary purpose of segregation of duties. The correct answer is preventing errors and fraud through division of critical functions.",
        "1": "Correct. The primary purpose of segregation of duties is to prevent errors and fraud by ensuring that no single individual has control over all aspects of a critical process or transaction. This creates a system of checks and balances.",
        "2": "This is incorrect. Although job rotation may be used alongside segregation of duties, increasing employee satisfaction is not its primary purpose. The correct answer is preventing errors and fraud through division of critical functions.",
        "3": "This is incorrect. Segregation of duties is a control principle, not a technical certification requirement. The correct answer is preventing errors and fraud through division of critical functions."
      },
      exam_tip: "SoD = No single person should have end-to-end control of a critical process (the power to both commit and conceal)."
    },
    {
      question: "Which governance framework emphasizes alignment of IT investment with business objectives through a value delivery focus?",
      options: [
        "ISO 27001",
        "NIST Cybersecurity Framework",
        "COBIT",
        "ITIL"
      ],
      correct_answer_index: 2,
      explanations: {
        "0": "This is incorrect. ISO 27001 is primarily focused on information security management systems, not on broader IT governance with business alignment. The correct answer is COBIT, which specifically addresses IT value delivery and alignment.",
        "1": "This is incorrect. The NIST Cybersecurity Framework focuses on managing cybersecurity risk, not specifically on aligning IT investments with business objectives. The correct answer is COBIT, which has a strong business alignment focus.",
        "2": "Correct. COBIT (Control Objectives for Information and Related Technologies) emphasizes aligning IT investments with business objectives through its value delivery domain. It bridges the gap between business goals, IT governance, and control requirements.",
        "3": "This is incorrect. While ITIL addresses IT service management and can support business objectives, it doesn't have the same explicit framework for IT investment alignment as COBIT. The correct answer is COBIT, which specifically addresses this alignment."
      },
      exam_tip: "COBIT = Business-IT alignment and value focus; ISO 27001 = Security focus; ITIL = Service management focus; NIST CSF = Cybersecurity risk focus."
    }
  ],
  
  // Management category
  "Management": [
    {
      question: "Which risk management approach involves assigning specific monetary values to assets, threats, vulnerabilities, and controls?",
      options: [
        "Qualitative risk analysis",
        "Quantitative risk analysis",
        "Risk matrix method",
        "Delphi technique"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Qualitative risk analysis uses descriptive categories (like high/medium/low) rather than specific monetary values. The correct answer is quantitative risk analysis, which uses precise numerical values.",
        "1": "Correct. Quantitative risk analysis involves assigning specific monetary values to assets, threats, vulnerabilities, and controls. It produces numerical outcomes such as Annual Loss Expectancy (ALE) and Return on Security Investment (ROSI).",
        "2": "This is incorrect. The risk matrix method typically uses qualitative ratings for likelihood and impact, not specific monetary values. The correct answer is quantitative risk analysis, which uses precise financial figures.",
        "3": "This is incorrect. The Delphi technique is a method of gathering expert opinions through rounds of questionnaires, not a method that assigns monetary values. The correct answer is quantitative risk analysis."
      },
      exam_tip: "Quantitative = $$$; Qualitative = High/Medium/Low. If you see monetary values like ALE or SLE, you're dealing with quantitative analysis."
    },
    {
      question: "Which management approach emphasizes rapid delivery, flexibility, and customer collaboration over comprehensive planning?",
      options: [
        "Waterfall methodology",
        "Agile methodology",
        "Critical path method",
        "Six Sigma"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Waterfall methodology emphasizes sequential phases and comprehensive upfront planning rather than flexibility. The correct answer is Agile methodology, which emphasizes adaptability and customer collaboration.",
        "1": "Correct. Agile methodology emphasizes rapid delivery in short iterations, flexibility to change, and ongoing customer collaboration over extensive planning. It focuses on delivering working solutions through incremental development.",
        "2": "This is incorrect. Critical path method is a project scheduling algorithm that focuses on identifying and managing the sequence of critical activities, not specifically on rapid delivery and flexibility. The correct answer is Agile methodology.",
        "3": "This is incorrect. Six Sigma is a data-driven methodology focused on process improvement and quality through reducing defects, not specifically on rapid delivery and flexibility. The correct answer is Agile methodology."
      },
      exam_tip: "Agile values: 1) Individuals and interactions over processes and tools; 2) Working software over comprehensive documentation; 3) Customer collaboration over contract negotiation; 4) Responding to change over following a plan."
    }
  ],
  
  // Policy category
  "Policy": [
    {
      question: "Which of the following best describes the relationship between policies, standards, and procedures in a policy framework?",
      options: [
        "Policies provide specific steps, standards define high-level requirements, and procedures provide measurable rules",
        "Policies define high-level requirements, standards provide measurable rules, and procedures outline specific steps",
        "Policies outline specific steps, procedures define high-level requirements, and standards provide measurable rules",
        "Policies, standards, and procedures all serve the same function but apply to different departments"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. This answer reverses the relationship between the three elements. The correct answer is that policies define high-level requirements, standards provide measurable rules, and procedures outline specific steps.",
        "1": "Correct. Policies define high-level requirements and expectations, standards provide specific measurable rules that support policies, and procedures outline the specific steps to implement standards and comply with policies.",
        "2": "This is incorrect. This answer misplaces all three elements. The correct answer is that policies define high-level requirements, standards provide measurable rules, and procedures outline specific steps.",
        "3": "This is incorrect. Policies, standards, and procedures serve distinct functions in a hierarchical framework, not the same function for different departments. The correct answer describes their proper hierarchical relationship."
      },
      exam_tip: "Remember the hierarchy: Policies (why) → Standards (what) → Procedures (how), with increasing levels of detail as you move down."
    },
    {
      question: "What is the primary purpose of a Data Classification Policy?",
      options: [
        "To establish ownership of all organizational data",
        "To define roles and responsibilities for data administrators",
        "To categorize data based on sensitivity and establish handling requirements",
        "To inventory all data assets within an organization"
      ],
      correct_answer_index: 2,
      explanations: {
        "0": "This is incorrect. While data ownership may be addressed, establishing ownership is not the primary purpose of a Data Classification Policy. The correct answer is categorizing data based on sensitivity and establishing handling requirements.",
        "1": "This is incorrect. Defining roles and responsibilities would typically fall under a Data Governance Policy rather than a Data Classification Policy. The correct answer is categorizing data based on sensitivity and establishing handling requirements.",
        "2": "Correct. The primary purpose of a Data Classification Policy is to categorize data assets based on their sensitivity and value, and to establish appropriate handling requirements for each category to ensure proper protection.",
        "3": "This is incorrect. Creating a data inventory is typically part of a data management or data discovery process, not the primary purpose of a Data Classification Policy. The correct answer is categorizing data based on sensitivity and establishing handling requirements."
      },
      exam_tip: "Classification comes before protection - you must know what you're protecting (and how sensitive it is) before you can protect it appropriately."
    }
  ],
  
  // Ethics category
  "Ethics": [
    {
      question: "Which of the following best describes the principle of 'least privilege' in information security ethics?",
      options: [
        "Users should have minimal training to perform their jobs effectively",
        "Systems should restrict access to only what is necessary for a legitimate purpose",
        "Organizations should collect the minimum amount of personal data",
        "Security controls should be as invisible to users as possible"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. The principle of least privilege doesn't relate to minimizing training but rather to restricting access rights. The correct answer is that systems should restrict access to only what is necessary for a legitimate purpose.",
        "1": "Correct. The principle of least privilege states that users should be granted only the minimum level of access rights and permissions needed to perform their legitimate job functions, reducing the potential damage from accidents or attacks.",
        "2": "This is incorrect. While this describes data minimization (a privacy principle), it is not the principle of least privilege. The correct answer relates to restricting access rights to only what is necessary.",
        "3": "This is incorrect. This describes the principle of security transparency or usability, not least privilege. The correct answer is that systems should restrict access to only what is necessary for a legitimate purpose."
      },
      exam_tip: "Least privilege = minimum access needed to do the job, not one bit more. Think of it as a 'need to know' basis for systems."
    },
    {
      question: "Which ethical principle refers to the requirement to notify affected individuals when their data has been compromised?",
      options: [
        "Informed consent",
        "Transparency",
        "Breach notification",
        "Accountability"
      ],
      correct_answer_index: 2,
      explanations: {
        "0": "This is incorrect. Informed consent relates to obtaining permission before collecting or processing data, not notification after a breach. The correct answer is breach notification, which specifically relates to informing affected individuals after a data compromise.",
        "1": "This is incorrect. While transparency is a broader ethical principle about openness, it doesn't specifically refer to the requirement to notify after data breaches. The correct answer is breach notification, which is the specific duty to inform affected parties.",
        "2": "Correct. Breach notification is the ethical and often legal requirement to inform individuals when their personal data has been compromised, allowing them to take protective measures like changing passwords or monitoring for identity theft.",
        "3": "This is incorrect. Accountability relates to taking responsibility for data protection and being able to demonstrate compliance, not specifically to breach notifications. The correct answer is breach notification, which is the specific duty to inform affected parties."
      },
      exam_tip: "Breach notification gives affected individuals power to protect themselves after a compromise. The ethical principle acknowledges that people have a right to know when their data is at risk."
    }
  ],
  
  // Threat Assessment category
  "Threat Assessment": [
    {
      question: "Which of the following threat modeling methodologies focuses on analyzing threats from the perspective of an attacker's goals?",
      options: [
        "STRIDE",
        "PASTA",
        "DREAD",
        "CVSS"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. STRIDE categorizes threats by type (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege), not from an attacker's goals perspective. The correct answer is PASTA, which takes an attacker-centric approach.",
        "1": "Correct. PASTA (Process for Attack Simulation and Threat Analysis) takes an attacker-centric approach by analyzing threats from the perspective of an attacker's goals and motivations, allowing for more targeted defenses.",
        "2": "This is incorrect. DREAD is a risk assessment model that quantifies risks based on Damage, Reproducibility, Exploitability, Affected users, and Discoverability. It doesn't specifically focus on attacker goals. The correct answer is PASTA.",
        "3": "This is incorrect. CVSS (Common Vulnerability Scoring System) is a framework for assessing the severity of vulnerabilities, not a methodology focused on attacker goals. The correct answer is PASTA, which takes an attacker-centric view."
      },
      exam_tip: "Remember: PASTA = Process for Attack Simulation and Threat Analysis. It's attacker-centric, focusing on goals and motivations rather than just cataloging vulnerabilities."
    },
    {
      question: "Which of the following is NOT a reliable source for threat intelligence?",
      options: [
        "Industry-specific Information Sharing and Analysis Centers (ISACs)",
        "Public comments on social media platforms",
        "MITRE ATT&CK Framework",
        "National vulnerability databases"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Industry-specific ISACs are reliable sources of threat intelligence, as they provide vetted information shared among industry peers. The correct answer is public comments on social media platforms, which are unreliable sources.",
        "1": "Correct. Public comments on social media platforms are NOT reliable sources for threat intelligence, as they often contain unverified information, speculation, rumors, and potentially misleading details without proper vetting or context.",
        "2": "This is incorrect. The MITRE ATT&CK Framework is a highly reliable, structured knowledge base of adversary tactics and techniques based on real-world observations. The correct answer is public comments on social media platforms.",
        "3": "This is incorrect. National vulnerability databases like the U.S. National Vulnerability Database (NVD) are authoritative sources for vulnerability information. The correct answer is public comments on social media platforms."
      },
      exam_tip: "Reliable threat intelligence requires verification, structure, and authority. Social media lacks all three - it's the digital equivalent of hearsay."
    }
  ],
  
  // Leadership category
  "Leadership": [
    {
      question: "Which cybersecurity leadership approach emphasizes the CISO's role as a business enabler rather than just a technical specialist?",
      options: [
        "Technology-first leadership",
        "Risk-based leadership",
        "Compliance-driven leadership",
        "Incident-focused leadership"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Technology-first leadership overly focuses on technical solutions rather than business enablement. The correct answer is risk-based leadership, which aligns security with business objectives.",
        "1": "Correct. Risk-based leadership emphasizes the CISO's role as a business enabler by aligning security decisions with business objectives and risk tolerance. It focuses on managing security in terms of business risk rather than purely technical concerns.",
        "2": "This is incorrect. Compliance-driven leadership focuses primarily on meeting regulatory requirements rather than enabling business initiatives. The correct answer is risk-based leadership, which better balances security with business needs.",
        "3": "This is incorrect. Incident-focused leadership emphasizes response and recovery rather than strategic business enablement. The correct answer is risk-based leadership, which aligns security efforts with business objectives."
      },
      exam_tip: "Modern CISOs speak the language of business risk, not just technical threats. Risk-based leadership connects security decisions directly to business outcomes."
    },
    {
      question: "Which leadership model is characterized by empowering teams to make decisions and fostering innovation through distributed authority?",
      options: [
        "Autocratic leadership",
        "Transformational leadership",
        "Bureaucratic leadership",
        "Servant leadership"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. Autocratic leadership concentrates decision-making authority with the leader and doesn't emphasize empowerment. The correct answer is transformational leadership, which emphasizes empowerment and innovation.",
        "1": "Correct. Transformational leadership is characterized by empowering teams to make decisions, fostering innovation through distributed authority, and inspiring followers to exceed their own self-interests for the good of the organization.",
        "2": "This is incorrect. Bureaucratic leadership adheres strictly to rules and procedures, limiting innovation and distributed authority. The correct answer is transformational leadership, which emphasizes empowerment and innovation.",
        "3": "This is incorrect. While servant leadership does focus on supporting team members, it doesn't specifically emphasize innovation through distributed authority as its primary characteristic. The correct answer is transformational leadership."
      },
      exam_tip: "Transformational leaders inspire others to transform their thinking. They create empowered teams that innovate beyond what was previously thought possible."
    }
  ],
  
  // Business Continuity category
  "Business Continuity": [
    {
      question: "Which term describes the maximum acceptable length of time a business process can be disrupted before causing significant harm?",
      options: [
        "Recovery Time Objective (RTO)",
        "Recovery Point Objective (RPO)",
        "Maximum Tolerable Downtime (MTD)",
        "Mean Time Between Failures (MTBF)"
      ],
      correct_answer_index: 2,
      explanations: {
        "0": "This is incorrect. Recovery Time Objective (RTO) is the targeted duration of time to restore a business process after a disaster, not the maximum acceptable length of time before significant harm occurs. The correct answer is Maximum Tolerable Downtime (MTD).",
        "1": "This is incorrect. Recovery Point Objective (RPO) refers to the maximum acceptable amount of data loss measured in time, not the acceptable length of process disruption. The correct answer is Maximum Tolerable Downtime (MTD).",
        "2": "Correct. Maximum Tolerable Downtime (MTD) is the maximum acceptable length of time a business process can be disrupted before causing significant harm to the organization. RTO must always be less than or equal to MTD.",
        "3": "This is incorrect. Mean Time Between Failures (MTBF) is a reliability metric that measures the average time between system failures, not the acceptable length of process disruption. The correct answer is Maximum Tolerable Downtime (MTD)."
      },
      exam_tip: "Remember the relationship: MTD > RTO. MTD is business-defined (maximum tolerable time), while RTO is IT-defined (targeted recovery time) and must fit within the MTD."
    },
    {
      question: "Which business continuity strategy involves maintaining identical systems at both primary and secondary sites that are both actively processing data?",
      options: [
        "Cold site",
        "Warm site",
        "Hot site",
        "Active-active configuration"
      ],
      correct_answer_index: 3,
      explanations: {
        "0": "This is incorrect. A cold site is an alternate facility with minimal infrastructure that requires substantial time to set up before operations can resume. The correct answer is active-active configuration, which has systems at both sites actively processing data.",
        "1": "This is incorrect. A warm site is pre-configured with hardware and software but requires data restoration and some setup time before becoming operational. The correct answer is active-active configuration, which has fully operational systems at both locations.",
        "2": "This is incorrect. While a hot site is fully configured and ready to operate with minimal downtime, it typically remains dormant until needed (active-passive). The correct answer is active-active configuration, where both sites actively process data simultaneously.",
        "3": "Correct. An active-active configuration involves maintaining identical systems at both primary and secondary sites, with both actively processing workloads simultaneously. This provides load balancing during normal operations and instant failover capabilities during disruptions."
      },
      exam_tip: "Active-Active means both sites are simultaneously processing live workloads; Active-Passive means the secondary site is ready but dormant until needed."
    }
  ],
  
  // Random category (general questions)
  "Random": [
    {
      question: "Which principle states that security controls should have multiple layers to protect assets, so that if one layer fails, others will still provide protection?",
      options: [
        "Principle of least privilege",
        "Defense in depth",
        "Separation of duties",
        "Need to know"
      ],
      correct_answer_index: 1,
      explanations: {
        "0": "This is incorrect. The principle of least privilege states that users should have only the minimum access rights needed to perform their job functions. The correct answer is defense in depth, which involves multiple layers of protection.",
        "1": "Correct. Defense in depth is the principle of implementing multiple layers of security controls throughout an information system. If one layer fails or is bypassed, other layers continue to provide protection.",
        "2": "This is incorrect. Separation of duties ensures that critical tasks are divided among multiple people to prevent fraud and errors. The correct answer is defense in depth, which focuses on layered security controls.",
        "3": "This is incorrect. Need to know is similar to least privilege but specifically refers to providing access to information only when it's required for someone's current task. The correct answer is defense in depth, which refers to multiple protection layers."
      },
      exam_tip: "Think of defense in depth like a medieval castle: moat, walls, guards, locked doors - not just one barrier!"
    },
    {
      question: "Which of the following BEST describes the relationship between governance, risk management, and compliance (GRC)?",
      options: [
        "They are three separate disciplines with no significant overlap",
        "Governance enforces compliance, which then determines risk management priorities",
        "Risk management dictates governance policies, which ensure compliance",
        "Governance sets direction, risk management identifies threats to objectives, and compliance ensures adherence to requirements"
      ],
      correct_answer_index: 3,
      explanations: {
        "0": "This is incorrect. Governance, risk management, and compliance are interconnected disciplines with significant overlap, not separate areas. The correct answer describes their integrated relationship.",
        "1": "This is incorrect. This reverses the actual relationship; governance doesn't simply enforce compliance, and compliance doesn't determine risk priorities. The correct answer properly describes how these elements work together.",
        "2": "This is incorrect. While risk considerations inform governance, risk management doesn't dictate governance policies. The correct answer accurately describes the relationship between these three components.",
        "3": "Correct. In GRC, governance sets organizational direction and objectives, risk management identifies and addresses threats to achieving those objectives, and compliance ensures adherence to internal policies and external regulations. They work together in an integrated framework."
      },
      exam_tip: "GRC works as an integrated system: Governance directs where to go, Risk Management identifies obstacles, and Compliance ensures you're following the rules of the road."
    }
  ]
};

// Improved function to get a GRC question with robust parsing and error handling
export const streamGRCQuestion = async (category = 'Random', difficulty = 'Easy') => {
  try {
    console.debug("Requesting GRC question:", { category, difficulty });
    
    const response = await apiClient.post(
      API.GRC.STREAM_QUESTION,
      { category, difficulty },
      {
        responseType: 'text'  // Get as raw text
      }
    );
    
    let responseText = response.data || '';
    console.debug("Raw GRC response received");
    
    // Enhanced cleaning and parsing
    try {
      // First attempt: Clean up and parse as is
      const cleanedText = cleanResponseText(responseText);
      let jsonData = safeJsonParse(cleanedText);
      
      // If first attempt succeeded
      if (jsonData) {
        console.debug("Successfully parsed GRC question on first attempt");
        lastSuccessfulQuestion = jsonData;
        return jsonData;
      }
      
      console.debug("Initial parse failed, attempting fixes...");
      
      // Attempt multiple parsing strategies
      const parsingStrategies = [
        // Strategy 1: Fix numeric keys
        fixNumericKeys,
        // Strategy 2: Quote all possible keys
        quoteAllPossibleKeys,
        // Strategy 3: Remove any non-JSON text before/after the JSON object
        extractJsonObject,
        // Strategy 4: Reconstruct JSON from extracted parts
        reconstructJson
      ];
      
      // Try each strategy in sequence
      for (const strategy of parsingStrategies) {
        const fixedText = strategy(cleanedText);
        const parsed = safeJsonParse(fixedText);
        
        if (parsed) {
          console.debug(`Successfully parsed GRC question with strategy: ${strategy.name}`);
          lastSuccessfulQuestion = parsed;
          return parsed;
        }
      }
      
      // If all parsing strategies fail, silently use fallback
      console.debug("All parsing strategies failed, using fallback question");
      return getRandomFallbackQuestion(category);
      
    } catch (parseError) {
      // Silently handle parse errors
      console.debug("JSON parse issue, using fallback");
      
      // If we have a previously successful question, use that as fallback
      if (lastSuccessfulQuestion) {
        console.debug("Using last successful question as fallback");
        return lastSuccessfulQuestion;
      }
      
      // Otherwise, return a fallback question based on category
      return getRandomFallbackQuestion(category);
    }
  } catch (error) {
    // Silently handle API errors
    console.debug('Network or API error, using fallback');
    
    // Return a previously successful question if available
    if (lastSuccessfulQuestion) {
      console.debug("Using last successful question as fallback after error");
      return lastSuccessfulQuestion;
    }
    
    // Fallback to a question based on category
    return getRandomFallbackQuestion(category);
  }
};

// Helper function to safely parse JSON
function safeJsonParse(text) {
  try {
    const data = JSON.parse(text);
    
    // Enhanced validation of required fields with better error checking
    if (data) {
      // Check for minimum required fields
      const hasQuestion = typeof data.question === 'string' && data.question.trim().length > 0;
      const hasOptions = Array.isArray(data.options) && data.options.length === 4;
      const hasCorrectAnswerIndex = typeof data.correct_answer_index !== 'undefined' && 
                                   (data.correct_answer_index === 0 || 
                                    data.correct_answer_index === 1 || 
                                    data.correct_answer_index === 2 || 
                                    data.correct_answer_index === 3);
      
      // Check for explanations - accept both object and array formats
      let hasExplanations = false;
      if (data.explanations) {
        if (typeof data.explanations === 'object') {
          // Count valid explanation entries (should have at least for correct answer)
          const explanationCount = Object.keys(data.explanations).length;
          hasExplanations = explanationCount >= 1;
        } else if (Array.isArray(data.explanations) && data.explanations.length >= 1) {
          hasExplanations = true;
        }
      }
      
      // If any critical field is missing, reject the parse
      if (!hasQuestion || !hasOptions || !hasCorrectAnswerIndex) {
        // Silently fail - use console.debug instead of warn/error
        console.debug("Missing critical fields in JSON response");
        return null;
      }
      
      // Create normalized data structure
      const normalizedData = {
        question: data.question,
        options: [...data.options],
        correct_answer_index: data.correct_answer_index,
        explanations: {},
        exam_tip: data.exam_tip || "Remember the key concepts related to this topic!"
      };
      
      // Normalize explanations to ensure object format with string keys
      if (typeof data.explanations === 'object' && !Array.isArray(data.explanations)) {
        // Convert all keys to strings
        Object.keys(data.explanations).forEach(key => {
          const strKey = String(key);
          normalizedData.explanations[strKey] = data.explanations[key];
        });
      } else if (Array.isArray(data.explanations)) {
        // Convert array to object with string keys
        data.explanations.forEach((explanation, index) => {
          normalizedData.explanations[String(index)] = explanation;
        });
      } else if (!hasExplanations) {
        // Create default explanation for the correct answer
        const correctIndex = String(data.correct_answer_index);
        normalizedData.explanations[correctIndex] = `This is the correct answer. ${data.options[data.correct_answer_index]} is the right choice for this question.`;
      }
      
      // Ensure all options have explanations (generate if missing)
      for (let i = 0; i < 4; i++) {
        const strIndex = String(i);
        if (!normalizedData.explanations[strIndex]) {
          if (i === data.correct_answer_index) {
            normalizedData.explanations[strIndex] = `This is the correct answer. ${data.options[i]} is the right choice for this question.`;
          } else {
            normalizedData.explanations[strIndex] = `This is incorrect. The correct answer is ${data.options[data.correct_answer_index]}.`;
          }
        }
      }
      
      return normalizedData;
    }
    
    return null;
  } catch (e) {
    // Silently fail - don't log the error to console.error
    console.debug("JSON parse issue - using fallback", e.message);
    return null;
  }
}

// Helper function to clean response text
function cleanResponseText(text) {
  // Remove any potential HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Remove markdown code blocks (handle various formats)
  if (text.includes('```json')) {
    text = text.replace(/```json\s?|\s?```/g, '');
  } else if (text.includes('```')) {
    text = text.replace(/```\s?|\s?```/g, '');
  }
  
  // Remove any leading/trailing whitespace or control characters
  text = text.replace(/^\s+|\s+$/g, '');
  
  // Remove special unicode characters that might interfere with JSON parsing
  text = text.replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200C-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g, '');
  
  return text;
}

// Helper function to fix numeric keys in JSON
function fixNumericKeys(text) {
  return text.replace(/(\{|\,)\s*(\d+)\s*\:/g, '$1"$2":');
}

// Helper function for more aggressive quoting
function quoteAllPossibleKeys(text) {
  return text.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
}

// Helper function to extract the JSON object from the text
function extractJsonObject(text) {
  // Look for text that starts with { and ends with }
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

// Try to reconstruct the JSON using regular expressions
function reconstructJson(text) {
  try {
    // Extract question
    const questionMatch = text.match(/"question"\s*:\s*"([^"]+)"/);
    const question = questionMatch ? questionMatch[1] : "Which of the following best describes the concept of defense in depth?";
    
    // Extract options
    const options = [];
    const optionMatches = text.match(/"options"\s*:\s*\[([\s\S]*?)\]/);
    if (optionMatches) {
      const optionsText = optionMatches[1];
      const optionRegex = /"([^"]+)"/g;
      let match;
      while ((match = optionRegex.exec(optionsText)) !== null && options.length < 4) {
        options.push(match[1]);
      }
    }
    
    // If we couldn't extract options, use default ones
    if (options.length !== 4) {
      options.length = 0; // Clear any partial extraction
      options.push("A single, highly secure control protecting critical assets");
      options.push("Multiple layers of security controls throughout an organization");
      options.push("The practice of hiding sensitive information from attackers");
      options.push("A strategy focused exclusively on perimeter security");
    }
    
    // Extract correct answer index
    let correctIndex = 1; // Default
    const correctIndexMatch = text.match(/"correct_answer_index"\s*:\s*(\d+)/);
    if (correctIndexMatch) {
      correctIndex = parseInt(correctIndexMatch[1]);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        correctIndex = 1;
      }
    }
    
    // Create explanations
    const explanations = {};
    // Try to extract each explanation
    for (let i = 0; i < 4; i++) {
      const explanationKey = `"${i}"`;
      const explanationRegex = new RegExp(`${explanationKey}\\s*:\\s*"([^"]+)"`, 'i');
      const explanationMatch = text.match(explanationRegex);
      
      if (explanationMatch) {
        explanations[i.toString()] = explanationMatch[1];
      } else {
        // Default explanations based on correctness
        if (i === correctIndex) {
          explanations[i.toString()] = `This is the correct answer. ${options[i]} is the right choice for this question.`;
        } else {
          explanations[i.toString()] = `This is incorrect. The correct answer is ${options[correctIndex]}.`;
        }
      }
    }
    
    // Extract exam tip or create default
    let examTip = "Remember the key concepts related to this question!";
    const examTipMatch = text.match(/"exam_tip"\s*:\s*"([^"]+)"/);
    if (examTipMatch) {
      examTip = examTipMatch[1];
    }
    
    // Construct the JSON object
    return {
      question,
      options,
      correct_answer_index: correctIndex,
      explanations,
      exam_tip: examTip
    };
  } catch (e) {
    console.error("Error reconstructing JSON:", e);
    return null;
  }
}

// Get a random fallback question based on category
function getRandomFallbackQuestion(category) {
  // Get questions for the requested category, or use Random if category not found
  const categoryQuestions = fallbackQuestions[category] || fallbackQuestions['Random'];
  
  // Choose a random question from the category's array
  const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
  return categoryQuestions[randomIndex];
}

// Maintain default fallback question for backward compatibility
function getDefaultQuestion() {
  return fallbackQuestions['Random'][0];
}
