// The staff training courses. Each is a short slide show followed by a quiz. Written in plain English
// for care staff. A bullet starts with "- ". The right answers stay on the server (see publicCourse):
// the browser only ever gets the questions and options.

export type Slide = { title: string; body: string[]; tip?: string };
export type Question = { q: string; options: string[]; answer: number; why: string };
export type Course = {
  key: string;
  title: string;
  subtitle: string;
  minutes: number;
  passPercent: number;
  intro: string;
  slides: Slide[];
  questions: Question[];
};

export const COURSES: Course[] = [
  {
    key: "engagement-activities",
    title: "Engagement and Activities in Care",
    subtitle: "Making every day meaningful for the people we support",
    minutes: 30,
    passPercent: 80,
    intro:
      "This short course is for everyone who works in a care home: carers, activity staff, kitchen, housekeeping and managers. It covers why activity matters, how to get to know the person, how to plan and run a session, and how to include everyone. At the end there is a short quiz.",
    slides: [
      {
        title: "Welcome",
        body: [
          "Activity is not just something to fill the time. It is a big part of how people feel about their day.",
          "By the end of this course you will be able to:",
          "- explain why activity and engagement matter",
          "- get to know what matters to each person",
          "- plan and run a simple session",
          "- include people with dementia, sensory loss and limited mobility",
          "- record what you saw so the team can build on it",
        ],
      },
      {
        title: "Why activity and engagement matter",
        body: [
          "Meaningful activity can help people to feel valued, to keep their skills and independence for longer, and to stay connected with others.",
          "It can also help with boredom, low mood and loneliness, which are common in care settings.",
          "Engagement means a person is involved and interested, in whatever way suits them. Watching, listening, smiling or joining in a little all count.",
          "Everyone has a right to a good day, whatever their health or ability.",
        ],
        tip: "Success is not a finished craft or a full table. Success is a person who feels included and comfortable.",
      },
      {
        title: "Know the person first",
        body: [
          "The best activity is the one that matters to that person. This is called person-centred care.",
          "Find out about their life story:",
          "- their job, family, hobbies and the places that mattered to them",
          "- favourite music, food, films, sport or animals",
          "- faith, culture and language",
          "- their daily routine, such as an early riser or a night owl",
          "- what they cannot stand",
          "Ask the person first. Then ask family and friends, and read the care plan or a 'This Is Me' style document.",
        ],
        tip: "Keep learning. People change, and so do their likes. Something loved last year may not be today.",
      },
      {
        title: "Different kinds of activity",
        body: [
          "A good week has a mix:",
          "- Physical: seated exercise, walks, dancing, balloon games",
          "- Thinking: quizzes, word games, puzzles, trivia",
          "- Creative: painting, colouring, crafts, baking",
          "- Social: bingo, tea parties, coffee mornings, games",
          "- Sensory: touch, smell, music, textures, light",
          "- Reminiscence: old photos, objects, songs, memories",
          "- Spiritual and cultural: services, festivals, prayer, language",
          "- Outdoors and nature: gardening, birds, fresh air",
        ],
      },
      {
        title: "Activity happens all day, not just in sessions",
        body: [
          "A planned session is only a small part of the day.",
          "Meaningful moments also happen at:",
          "- mealtimes, when we offer choice and chat",
          "- getting up and getting dressed, when we ask what someone would like to wear",
          "- helping with everyday jobs, such as folding laundry, setting a table or watering plants",
          "- a quiet chat, a song, or a hand held",
          "Every member of staff plays a part, including kitchen, housekeeping, maintenance and admin.",
        ],
        tip: "If you have two minutes and a resident is sitting alone, sit and talk. That is an activity.",
      },
      {
        title: "Planning a session",
        body: [
          "Before you start, think about:",
          "- Who is coming, and what do they enjoy and what can they do?",
          "- What will you do, and have you got everything you need ready?",
          "- Where will it be? Check lighting, noise, seating and space for wheelchairs and frames.",
          "- When is best? Avoid mealtimes and medication rounds, and think about when people are most alert.",
          "- Have people been to the toilet, and do they have their glasses and hearing aids?",
          "Keep groups small if people need more help. Have a simpler version ready and a second idea in case it is not working.",
        ],
      },
      {
        title: "Running a session",
        body: [
          "- Welcome people by name and say what is happening.",
          "- Give one simple instruction at a time.",
          "- Go at the pace of the group. Leave time for people to answer.",
          "- Offer choices, not orders.",
          "- Give praise and encouragement, and make it fun.",
          "- There are no wrong answers. Do not correct or test people.",
          "- Let people stop, watch or leave when they want to.",
          "- End well: thank everyone, and say what is happening next.",
        ],
        tip: "Your mood sets the mood. A smile and a calm voice go a long way.",
      },
      {
        title: "Including people with dementia",
        body: [
          "- Use short, clear sentences and a calm, friendly tone.",
          "- Show as well as tell. Demonstrate, point, or hand the person the item.",
          "- Be patient. Allow extra time to respond.",
          "- Do not argue or correct. If the person is upset, listen and reassure.",
          "- Choose familiar, adult activities from the person's life, such as old songs and photos.",
          "- Reduce distractions such as noise, clutter and a busy background.",
          "- Notice how the person is feeling today. If they are not up to it, try again later.",
        ],
        tip: "Large, high-contrast, uncluttered resources are easier to see and understand. Many of our activities have large print sheets.",
      },
      {
        title: "Including everyone",
        body: [
          "Hearing loss: face the person, speak clearly, check hearing aids, reduce background noise.",
          "Sight loss: good lighting, large print, high contrast, and describe what is happening.",
          "Limited mobility: use seated versions, bring the activity to the person, and place items within reach.",
          "Different language: use communication cards, pictures, gesture and a few words in their language.",
          "Communication needs: Makaton, BSL, objects of reference and picture cards can all help.",
          "Ask the person or the team what works. Never assume someone cannot take part.",
        ],
      },
      {
        title: "One-to-one and in-room activity",
        body: [
          "Some people cannot or do not want to join groups, for example people who are unwell, in bed, or who prefer their own company.",
          "Ten minutes of one-to-one time can mean a great deal. Ideas:",
          "- music they love, or a chat about family photos",
          "- reading the paper or a favourite story aloud",
          "- a hand massage or a sensory box (with their agreement)",
          "- a puzzle, colouring, or looking out of the window together",
          "Knock, introduce yourself, ask permission and respect privacy and dignity.",
        ],
      },
      {
        title: "Choice, consent and dignity",
        body: [
          "- People can choose whether to join in. Always offer, never force.",
          "- Do not assume someone lacks the capacity to decide. Support them to make their own choices.",
          "- If a person says no or walks away, respect that and try something different.",
          "- Treat everyone as an adult. Avoid anything childish or patronising.",
          "- Respect culture and faith, including food, music, dress and festivals.",
          "- If you think someone is being excluded or treated badly, tell your manager straight away.",
        ],
      },
      {
        title: "Keeping people safe",
        body: [
          "- Check care plans and ask the care team about allergies, swallowing problems and other risks before any food or drink activity.",
          "- Watch for trip hazards. Keep walkways clear and use stable chairs.",
          "- Check that equipment is clean, safe and suitable for the people using it.",
          "- Keep an eye on who might get tired, upset or need the toilet.",
          "- Follow the home's infection control practice, including hand hygiene and cleaning shared items.",
          "- Report accidents, near misses and any safeguarding concern to your manager and follow the home's policy.",
        ],
        tip: "If you are not sure whether something is safe for someone, ask before you start.",
      },
      {
        title: "Recording and reviewing",
        body: [
          "Write short, honest notes after an activity. Include:",
          "- who took part, and who watched",
          "- how they responded: smiling, chatting, restless, or tired",
          "- anything that worked well or did not",
          "- anything the care team should know, such as a new skill, a memory, or a worry",
          "Good records show that people are getting a varied programme of activity. They also help the team to plan better sessions and support care plan reviews.",
          "Keep notes factual and respectful. Do not write anything you would not want the person to read.",
        ],
      },
      {
        title: "Using Activity Central to help",
        body: [
          "Activity Central gives you ready-made ideas so you can spend time with people, not preparing.",
          "- Print activities, with large print versions on most of them, or play them on screen.",
          "- Use the Holidays and Celebrations calendar to plan around special dates.",
          "- Try conversation starters, sing-alongs, quizzes, bingo and colouring when you have a few minutes.",
          "- Use communication cards and talking boards when words are difficult.",
          "Always check any activity is suitable for the people taking part.",
        ],
      },
      {
        title: "Key points to remember",
        body: [
          "- Get to know the person and what matters to them.",
          "- Every moment of the day can be meaningful.",
          "- Plan, but be ready to adapt.",
          "- Offer choice and respect no.",
          "- Include everyone, whatever their needs.",
          "- Keep people safe and report any concerns.",
          "- Write short, honest notes afterwards.",
          "Now take the quiz. You need 80% to pass and you can try again if you need to.",
        ],
      },
    ],
    questions: [
      {
        q: "What is the best way to choose an activity for someone?",
        options: [
          "Use the same activity for everyone",
          "Base it on what matters to that person: their life story, likes and abilities",
          "Choose whatever is quickest to set up",
          "Let the person with the loudest voice decide",
        ],
        answer: 1,
        why: "Person-centred care starts with knowing the person and what matters to them.",
      },
      {
        q: "A resident with dementia gives a wrong answer in a quiz. What should you do?",
        options: [
          "Correct them so they learn the right answer",
          "Tell them they are wrong and move on",
          "Respond kindly. There are no wrong answers, so keep it fun and relaxed",
          "Stop the quiz",
        ],
        answer: 2,
        why: "Correcting or testing can cause distress. Keep it positive and supportive.",
      },
      {
        q: "Which of these counts as engagement?",
        options: [
          "Only joining in the whole activity",
          "Only people who speak during the session",
          "Watching, listening, smiling or joining in a little",
          "Only people who finish what they started",
        ],
        answer: 2,
        why: "Engagement means being involved and interested in whatever way suits the person.",
      },
      {
        q: "When might activity and engagement happen?",
        options: [
          "Only in the planned session in the lounge",
          "Only when the activity coordinator is on duty",
          "Throughout the day, in everyday moments such as mealtimes, dressing and chatting",
          "Only on weekdays",
        ],
        answer: 2,
        why: "Meaningful moments happen all day, and every member of staff has a part to play.",
      },
      {
        q: "A resident says they do not want to join in. What should you do?",
        options: [
          "Encourage them until they agree",
          "Respect their choice and offer something different, or try again later",
          "Tell their family they are not cooperating",
          "Put them in the activity anyway so they are not alone",
        ],
        answer: 1,
        why: "People have the right to choose. Offer, never force.",
      },
      {
        q: "Which is a good way to give instructions in a group?",
        options: [
          "Give all the steps at once, quickly",
          "One simple instruction at a time, leaving time to respond",
          "Say it once, loudly",
          "Leave people to work it out",
        ],
        answer: 1,
        why: "One simple step at a time, at the pace of the group, helps everyone to follow.",
      },
      {
        q: "Before a food or drink activity, you should:",
        options: [
          "Start straight away to save time",
          "Check care plans and ask the care team about allergies and swallowing risks",
          "Only ask the people who look unwell",
          "Let residents decide for themselves what is safe",
        ],
        answer: 1,
        why: "Allergies and swallowing problems can be serious. Always check first.",
      },
      {
        q: "A resident is in bed and does not want to come to a group. What could you do?",
        options: [
          "Nothing, they are not interested",
          "Offer a short one-to-one visit, such as music, photos or a chat, if they would like it",
          "Wait until they feel better",
          "Ask another resident to talk to them",
        ],
        answer: 1,
        why: "Short, one-to-one time can mean a great deal, with the person's agreement.",
      },
      {
        q: "What should you write in your notes after an activity?",
        options: [
          "Nothing, as long as the session went well",
          "Who took part, how they responded, and anything the team should know",
          "Opinions about residents' personalities",
          "Only the names of people who did not take part",
        ],
        answer: 1,
        why: "Short, factual and respectful notes help the team plan and review care.",
      },
      {
        q: "You think a resident is being left out and treated unkindly. You should:",
        options: [
          "Say nothing, it is not your job",
          "Tell your manager straight away and follow the home's policy",
          "Wait to see if it happens again",
          "Mention it to the resident's visitors",
        ],
        answer: 1,
        why: "Any concern about someone's treatment or safety must be reported straight away.",
      },
    ],
  },
  {
    key: "getting-started",
    title: "Getting Started with Activity Central",
    subtitle: "A tour of the website and how to use it every day",
    minutes: 20,
    passPercent: 80,
    intro:
      "This course is a guided tour of the Activity Central website. It shows where to find things, how to print and play activities, how to use the calendar and shared files, and how to use the Dementia friendly view. At the end there is a short quiz. Have the website open in another tab so you can try things as you go.",
    slides: [
      {
        title: "Welcome to Activity Central",
        body: [
          "Activity Central is a library of ready-to-use activities for care homes. It helps you spend less time preparing and more time with the people you support.",
          "In this tour you will learn how to:",
          "- log in and find your way around",
          "- find, print and play activities",
          "- use the Holidays and Celebrations calendar",
          "- share a calendar or file with families, with a link or QR code",
          "- use communication boards and the bingo caller",
          "- switch on the Dementia friendly view",
          "- get help",
        ],
      },
      {
        title: "Logging in and the dashboard",
        body: [
          "Go to the Activity Central website and choose Log in. Use the email address and password for your home's account.",
          "After logging in you land on the dashboard. You will see:",
          "- tiles for each category of activity",
          "- your recent downloads",
          "- popular activities this month",
          "- a menu down the left side (on a phone, behind the Menu button)",
          "Choose Dashboard in the menu at any time to come back here.",
        ],
        tip: "One account is usually shared by the whole home. Please do not share the password outside your team.",
      },
      {
        title: "The menu",
        body: [
          "The menu on the left takes you to:",
          "- Dashboard: your home page",
          "- Calendar: Holidays and Celebrations, with the Professional Calendar if your home has it",
          "- The categories: Crosswords, Word Searches, Trivia, Bingo, Sing-Alongs, Colouring Pages, Conversation Starters and more",
          "- Services, Shared files, My account",
          "- Help and support",
          "Some items, such as Questionnaires, only show if your home has them switched on.",
        ],
      },
      {
        title: "Finding an activity",
        body: [
          "Choose a category from the menu or the dashboard tiles. You will see a list of activities.",
          "- Use the search box at the top to find something quickly, for example 'birds' or 'Christmas'.",
          "- Use the theme buttons to narrow the list.",
          "- Tap the star next to an activity to add it to your Favourites. Use the Favourites tab to see only your starred ones.",
          "Look through a few categories to see what is there. There is a lot to choose from.",
        ],
        tip: "Starring the activities you use most makes planning quicker for the whole team.",
      },
      {
        title: "Printing an activity",
        body: [
          "Each activity has buttons to download or print it. Many have an answer sheet too.",
          "- Standard print (A4) is on every activity.",
          "- Large Print (A3) is on most activities for people with low vision (Premium). Not every activity has one.",
          "Always look at an activity before you use it, to check it is suitable for the people taking part. The same goes for any video linked to an activity.",
          "If the Premium prompt appears on an activity, your home is on the Standard plan. Ask your manager.",
        ],
      },
      {
        title: "Playing on screen",
        body: [
          "On the Premium plan many activities can be played on screen, with no printer needed. This includes puzzles and games such as crosswords, word searches, sudoku, trivia, matching pairs, spot the difference and snakes and ladders.",
          "Cast or connect a laptop or tablet to a TV and play together as a group.",
          "It is a great way to run an activity at short notice.",
        ],
        tip: "Use the Dementia friendly switch first if the group would find a plainer, higher contrast screen easier.",
      },
      {
        title: "The Holidays and Celebrations calendar",
        body: [
          "The calendar has the main UK dates already filled in, such as bank holidays, Halloween, Remembrance Sunday and many more.",
          "- Use Previous and Next to move between months.",
          "- Choose + Add event to add your own: a birthday party, a visiting singer, a trip. You can edit or remove your own events.",
          "- Add your weekly rota if your home uses one.",
          "- Click a built-in occasion to find themed activities for it.",
        ],
      },
      {
        title: "Printing and notes",
        body: [
          "- Print (A4) or Print Large (A3) gives you a month on one page.",
          "- You can print a week with bigger boxes and writing lines.",
          "- Under the calendar is a Notes box. Each line can be a different colour: click a line, then choose a colour. Press Enter for a new line and use Bullet points for lists.",
          "- Your notes are saved to your account, so everyone logged in sees the same notes.",
          "- Choose whether the notes box prints with the tick box 'Print this box'.",
        ],
      },
      {
        title: "Sharing your calendar",
        body: [
          "Choose Share calendar to make a link for your website, newsletter or noticeboard.",
          "- Pick the year and the months to show.",
          "- You get a link and a QR code. Families can scan it to see what is coming up.",
          "- The shared page shows your events and your notes at the bottom of each month.",
          "- You can switch a link off at any time.",
        ],
        tip: "Do not put residents' names or private details in events, because anyone with the link can see them.",
      },
      {
        title: "Shared files and QR codes",
        body: [
          "Shared files lets you upload a menu, newsletter or photos and get a link or QR code.",
          "- You can split a link into sections that you name yourself, such as Menu, Calendar and Forms.",
          "- Swap a file later without changing the link or QR code.",
          "- Print the QR code and put it on the noticeboard or reception.",
        ],
      },
      {
        title: "Communication cards and talking boards",
        body: [
          "Communication boards help people who find it hard to speak, or who speak another language.",
          "- Choose a language and a topic, such as food, drink, comfort or feelings.",
          "- The board speaks the words aloud and shows large, clear buttons for the person to choose.",
          "- There are boards in 24 languages (Premium).",
        ],
        tip: "Try it with a colleague first so you know how it works before you use it with a resident.",
      },
      {
        title: "The bingo caller",
        body: [
          "The bingo caller picks numbers for you and can say them aloud.",
          "- Choose a male or female voice.",
          "- Choose other languages to hear each number in more than one language.",
          "- Show or hide the numbers called so far.",
          "Use it with printed bingo cards or the on-screen games.",
        ],
      },
      {
        title: "Dementia friendly view",
        body: [
          "The Dementia friendly switch is in the top bar of the dashboard. It also appears on the calendar.",
          "- When it is on, the screen is black on white, a little larger and has thicker outlines and bright yellow highlights.",
          "- It hides the decorative seasonal scenes to keep things plain.",
          "- Your choice is saved to your account and follows you to any device.",
          "Turn it on whenever the group would find a simpler screen easier.",
        ],
      },
      {
        title: "My account, help and support",
        body: [
          "- My account: your details, subscription, email choices and a form to suggest new activities.",
          "- Help and support: contact us by email with any question.",
          "- Email choices: you can opt in or out of our updates at any time.",
          "If something is not working, tell your manager. They can contact support.",
        ],
      },
      {
        title: "Key points to remember",
        body: [
          "- Use the menu and search to find activities fast.",
          "- Star your favourites.",
          "- Print on A4 or Large Print A3, or play on screen.",
          "- Plan with the calendar, and share it with a link or QR code.",
          "- Use communication boards and the bingo caller to include everyone.",
          "- Switch on Dementia friendly view when it helps.",
          "- Always check an activity is suitable before you use it.",
          "Now take the quiz. You need 80% to pass.",
        ],
      },
    ],
    questions: [
      {
        q: "Where do you go to come back to the main page after logging in?",
        options: ["Help and support", "Dashboard in the menu", "My account", "Services"],
        answer: 1,
        why: "Choose Dashboard in the menu at any time to come back to the home page.",
      },
      {
        q: "How can you find activities about 'birds' quickly in a category?",
        options: [
          "Scroll to the bottom of the page",
          "Use the search box at the top of the list",
          "Phone support",
          "Print the whole category",
        ],
        answer: 1,
        why: "Each category has a search box and theme buttons above the list.",
      },
      {
        q: "What does tapping the star next to an activity do?",
        options: [
          "Deletes it",
          "Adds it to your Favourites so it is easy to find",
          "Prints it",
          "Sends it to a colleague",
        ],
        answer: 1,
        why: "Starred activities appear under the Favourites tab.",
      },
      {
        q: "Large Print (A3) versions are best for:",
        options: [
          "People with low vision",
          "Saving paper",
          "Children",
          "Staff meetings",
        ],
        answer: 0,
        why: "Large print makes activities easier to see for people with low vision.",
      },
      {
        q: "In the calendar notes box, how do you give one line its own colour?",
        options: [
          "You cannot. The whole note is one colour",
          "Click the line, then choose a colour",
          "Type the colour name",
          "Print it in colour",
        ],
        answer: 1,
        why: "Click a line and then pick a colour. Tick 'Whole note' to colour every line.",
      },
      {
        q: "Who can see what you put on a shared calendar link?",
        options: [
          "Only your colleagues",
          "Anyone who has the link or QR code",
          "Only people with an Activity Central account",
          "Nobody. It is private",
        ],
        answer: 1,
        why: "Anyone with the link can see it, so never put residents' names or private details in events.",
      },
      {
        q: "What is a good use of Shared files?",
        options: [
          "Storing residents' care records",
          "Getting a link or QR code for a menu or newsletter",
          "Sharing your password",
          "Printing activities",
        ],
        answer: 1,
        why: "Shared files gives you a link or QR code for things like menus and newsletters.",
      },
      {
        q: "What does the Dementia friendly switch do?",
        options: [
          "Makes the screen black on white, a little larger, with thick outlines and yellow highlights",
          "Deletes your notes",
          "Changes your plan",
          "Turns the sound off",
        ],
        answer: 0,
        why: "It makes the screen plainer and easier to read, and your choice is saved to your account.",
      },
      {
        q: "Communication boards are useful for:",
        options: [
          "Printing the calendar",
          "People who find it hard to speak or who speak another language",
          "Changing your password",
          "Running bingo",
        ],
        answer: 1,
        why: "The boards speak words aloud and give large, clear choices to help people communicate.",
      },
      {
        q: "Before using any activity with residents you should:",
        options: [
          "Use it straight away, they are all checked",
          "Check that it is suitable and safe for the people taking part",
          "Ask the residents to check it",
          "Only check the videos",
        ],
        answer: 1,
        why: "Staff should always look at an activity first and use their professional judgement.",
      },
    ],
  },
];

import { narrationFor } from "@/lib/trainingNarration";
export { narrationFor };

export function getCourse(key: string) {
  return COURSES.find((c) => c.key === key) ?? null;
}

// What the browser is allowed to see: no answers, no explanations.
export function publicCourse(course: Course) {
  return {
    key: course.key,
    title: course.title,
    subtitle: course.subtitle,
    minutes: course.minutes,
    passPercent: course.passPercent,
    intro: course.intro,
    slides: course.slides,
    questions: course.questions.map((q) => ({ q: q.q, options: q.options })),
  };
}

export function courseNarrationChars(course: Course) {
  return course.slides.reduce((n, s) => n + narrationFor(s).join(" ").length, 0);
}

// Every sentence the course may say, so the speech route can be limited to our own course text.
let phrases: Set<string> | null = null;
export function trainingPhrases() {
  if (phrases) return phrases;
  const set = new Set<string>();
  for (const c of COURSES) for (const s of c.slides) for (const t of narrationFor(s)) set.add(t);
  phrases = set;
  return set;
}
