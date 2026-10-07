import type { FormDef, FormItem } from "@/lib/forms";

// Westcliff Lodge's three annual feedback questionnaires (August 2026), as
// written in their documents: residents, relatives and friends, and staff.

const RESIDENT_OPTIONS = ["I strongly agree", "I somewhat agree", "I disagree", "I don't think this applies to me"];
const RELATIVE_OPTIONS = ["Good", "Satisfactory", "Poor", "I don't think this applies to me"];
const STAFF_OPTIONS = ["Strongly agree", "Agree", "Disagree", "Strongly disagree", "I don't think this applies to me"];
const STAFF_TICK = ["Yes", "No", "Sometimes", "Do not wish to answer"];

function build(prefix: string, rows: (string | [string, string?] | { section: string; text?: string } | { free: string; hint?: string })[], options: string[], commentLabel: string): FormItem[] {
  const items: FormItem[] = [];
  let n = 0;
  for (const row of rows) {
    if (typeof row === "string" || Array.isArray(row)) {
      const text = typeof row === "string" ? row : row[0];
      items.push({ type: "choice", id: `${prefix}${++n}`, text, options, comment: commentLabel });
    } else if ("section" in row) {
      items.push({ type: "section", title: row.section, text: row.text });
    } else {
      items.push({ type: "text", id: `${prefix}${++n}`, text: row.free, hint: row.hint, long: true });
    }
  }
  return items;
}

export const RESIDENT_FORM: FormDef = {
  title: "Resident Feedback Questionnaire",
  intro:
    "We ask residents to complete this survey once a year so we can understand what is working well and what needs to improve. The questions are aligned to CQC's five key questions: Safe, Effective, Caring, Responsive and Well-led.\n\nYour answers are confidential. You may leave your name blank if you prefer. Please ask a member of staff if you need help to complete this form.",
  thanks: "Thank you for taking the time to complete this questionnaire. Your views and opinions matter to us.",
  items: [
    ...build(
      "r",
      [
        { section: "Safe care" },
        "Staff help me safely when I need them.",
        "I feel protected from abuse, neglect or poor treatment.",
        "Risks to my safety are explained and managed with me.",
        "Medicines, treatment and health appointments are managed safely for me.",
        "The home is clean and infection risks are managed well.",
        "There are enough suitable staff to support me safely.",
        "I know who to speak to if I feel unsafe or worried.",
        { free: "Any other comments about safety at Westcliff Lodge?" },
        { section: "Effective care and support" },
        "Your care and support meet your needs and choices.",
        "Your care plan is reviewed with you and updated when things change.",
        "You are supported to access healthcare services when needed.",
        { section: "Caring, dignity and respect" },
        "Staff treat you with kindness, dignity and respect.",
        "Your privacy is respected, including personal care and private conversations.",
        "Staff know you as an individual, including your routines, preferences and beliefs.",
        "You are encouraged to make choices and stay as independent as possible.",
        "Staff respond respectfully when you need help, reassurance or information.",
        "You can keep important relationships and contact with family, friends and visitors.",
        "You feel listened to and taken seriously.",
        "Mealtimes feel comfortable, respectful and unhurried.",
        { free: "Any other comments about dignity, respect or how staff treat you?" },
        { section: "Responsive care and daily life" },
        "Activities, social opportunities and one-to-one support reflect your interests.",
        "You can choose how to spend your day where possible.",
        "Food, drinks and snacks reflect your choices and dietary needs.",
        "You receive information in a way you can understand.",
        { free: "Any other comments about daily life, activities, meals or communication?" },
        { section: "Well-led service and complaints" },
        "You know how to make a complaint or raise a concern.",
        "Concerns or complaints are listened to and acted on.",
        "Managers are approachable and available when you need them.",
        "Residents are asked for views and told what changes are made from feedback.",
      ],
      RESIDENT_OPTIONS,
      "Any comment:"
    ),
    { type: "text", id: "name", text: "Your name (you can leave this blank)" },
  ],
};

export const RELATIVES_FORM: FormDef = {
  title: "Relatives and Friends Feedback Questionnaire",
  intro:
    "Annual Friends and Family Feedback Survey. Your feedback helps us check what is working well, what could be improved, and how we can continue to meet the standards expected by residents, families, commissioners and the Care Quality Commission.\n\nFor each question, please choose one rating: Good, Satisfactory, Poor or \"I don't think this applies to me\". Please add comments where possible, especially if you choose Poor or if you have an example that would help us learn.",
  thanks:
    "Thank you for taking the time to complete this survey. You are not required to give your name or contact details unless you wish to. If you would like to discuss any of the points you have raised, please leave your name and contact information and a member of the management team will be happy to get in touch with you.",
  items: [
    ...build(
      "f",
      [
        "Do you feel welcome, respected and supported by staff when you visit Westcliff Lodge?",
        "Is Westcliff Lodge clean, comfortable, homely and well maintained?",
        "Do staff appear to know your relative or friend as an individual, including their preferences, routines, communication needs and what matters to them?",
        "Do you find staff polite, approachable and respectful?",
        "When you need to speak about your relative or friend, are staff available and able to provide appropriate information while respecting confidentiality?",
        "Are you satisfied that Westcliff Lodge helps your relative or friend access appropriate health and care professionals, such as GP, dentist, chiropodist, optician, occupational therapist or physiotherapist?",
        "Do you feel your views are listened to and acted on where appropriate?",
        "Does the home support residents to take part in meaningful activities, social opportunities and interests that suit them?",
        "Are your relative or friend's food, drink, cultural, religious or dietary preferences known and respected?",
        "Do you feel your relative or friend is supported to eat and drink well, including help with nutrition and hydration where needed?",
        "Do you feel relationships between your relative or friend and staff are positive, kind and respectful?",
        "Do you feel well informed about your relative or friend's care, wellbeing and day-to-day life at the home?",
        "Are you kept up to date about significant changes in their health, care, risks or care plan where appropriate?",
        "Do you feel included in decisions about your relative or friend's care where this is appropriate and in line with their wishes and consent?",
      ],
      RELATIVE_OPTIONS,
      "Please comment to assist us:"
    ),
    { type: "section", title: "In your own words" },
    { type: "text", id: "does-well", text: "What do you feel Westcliff Lodge does well?", hint: "Please give as many examples as you can.", long: true },
    { type: "text", id: "improve", text: "What could Westcliff Lodge improve over the next 12 months?", long: true },
    { type: "text", id: "areas", text: "Are there any areas of the home, facilities or visiting arrangements that you feel should be improved?", long: true },
    { type: "section", title: "About you (optional)", text: "You do not have to give your name or contact details. If you would like a response, please add them here." },
    { type: "text", id: "name", text: "Your name" },
    { type: "text", id: "contact", text: "Your contact details (phone or email)" },
  ],
};

export const EMPLOYEE_FORM: FormDef = {
  title: "Annual Employee / Staff Feedback Questionnaire 2026",
  intro:
    "This annual questionnaire helps Westcliff Lodge understand what is working well for staff and what could be improved. Your feedback supports safe, effective, caring, responsive and well-led care for the people who live here.\n\nPlease answer openly and honestly. You may remain anonymous, and all feedback will be reviewed without prejudice.\n\nIf you raise an urgent safety concern, please tell the Manager, Deputy Manager or Nominated Individual straight away rather than waiting for this survey to be reviewed.",
  thanks: "Thank you for taking the time to complete this questionnaire. Your views and opinions matter to us.",
  items: [
    { type: "choice", id: "service", text: "Firstly, please tell us your length of service at Westcliff Lodge.", options: ["Less than a year", "1-2 years", "3-5 years", "Over 5 years"] },
    ...build(
      "e",
      [
        { section: "Communication, speaking up and team information" },
        "I feel communication within the organisation is clear and effective.",
        "I feel confident asking questions or raising concerns with the Manager.",
        "I understand how to report safeguarding, whistleblowing, accidents, incidents and near misses.",
        "I feel safe to speak up and believe concerns will be listened to and acted on fairly.",
        "I am kept informed about important changes and updates that affect my work.",
        "My opinions are valued and considered.",
        "I have the information I need to know what is expected of me to do a good job.",
        "Communication is professional, respectful and helpful.",
        { free: "Do you have any comments about our communication?", hint: "If you are unhappy with any aspect, please give an example or suggest how we could improve." },
        { section: "Recognition, reward and fair treatment" },
        "I feel appreciated for the work I do.",
        { free: "Do you have any feedback on recognition and reward?", hint: "If you're unhappy, please share an example or suggest how we could improve." },
        { section: "Training and development" },
        "I have received the training I need to do my job confidently.",
        "I have the tools and resources I need to succeed.",
        { free: "Do you have any feedback on training, supervision, appraisal, development or resources?", hint: "If you are unhappy, please share an example or suggest how we could improve." },
        { section: "Job satisfaction" },
        "I find my work fulfilling and meaningful.",
        "Westcliff Lodge is a positive place to work.",
        "My team works well together and supports each other.",
        "The workplace feels safe and supportive.",
        { free: "What do you enjoy most about your role?" },
        { free: "What is the hardest aspect of your role?" },
        { free: "Do you have any suggestions how we may help you with the aspects of your role that you struggle with?" },
        { free: "Are there any other comments you would like to make regarding job satisfaction?", hint: "If you are dissatisfied, please give an example or suggest how we may improve this aspect of our service." },
      ],
      STAFF_OPTIONS,
      "Please comment to assist us:"
    ),
    {
      type: "section",
      title: "Wellbeing and support",
      text: "Working in adult social care can be demanding. We want to understand whether staff feel safe, supported, treated fairly and able to access help when needed. Please tell us where support could be improved. The information you provide will be used anonymously (unless otherwise requested) and will inform future service updates, team meetings, and queries best directed towards other external support agencies.",
    },
    { type: "choice", id: "safe-supported", text: "Do you feel safe and supported in your current role?", options: STAFF_TICK, comment: "Please comment to assist us:" },
    { type: "choice", id: "coping", text: "Are you coping emotionally at the moment?", options: STAFF_TICK, comment: "Please comment to assist us:" },
    { type: "section", title: "Finally" },
    { type: "choice", id: "anonymous", text: "Would you like to remain anonymous?", options: ["Yes", "No"] },
    { type: "text", id: "name", text: "If you answered No, please add your name here" },
  ],
};

export const WESTCLIFF_TEMPLATES = [
  { key: "resident", label: "Resident feedback questionnaire", def: RESIDENT_FORM },
  { key: "relatives", label: "Relatives and friends feedback questionnaire", def: RELATIVES_FORM },
  { key: "employee", label: "Employee / staff feedback questionnaire", def: EMPLOYEE_FORM },
] as const;

export type TemplateKey = (typeof WESTCLIFF_TEMPLATES)[number]["key"];
