export interface KnownFact {
  question: string;
  expectedAnswer: string;
  sourceDocument: string;
  sourceFact: string;
}

export const KNOWN_FACTS: KnownFact[] = [
  {
    question: "What is the project codename?",
    expectedAnswer: "Antigravity",
    sourceDocument: "sample.txt",
    sourceFact: "The project codename is 'Antigravity'."
  },
  {
    question: "What is the total committed budget?",
    expectedAnswer: "$1.2 million",
    sourceDocument: "sample.pdf",
    sourceFact: "The total budget committed is $1.2 million."
  },
  {
    question: "Who is the lead scientist?",
    expectedAnswer: "Dr. Elena Vance",
    sourceDocument: "sample.docx",
    sourceFact: "The lead scientist is Dr. Elena Vance."
  },
  {
    question: "When is the launch date?",
    expectedAnswer: "June 15th, 2026",
    sourceDocument: "sample.md",
    sourceFact: "The launch date is June 15th, 2026."
  },
  {
    question: "What is the core material?",
    expectedAnswer: "Zero-G Polymer",
    sourceDocument: "sample.csv",
    sourceFact: "The core material used is Zero-G Polymer."
  },
  {
    question: "What is the secondary material?",
    expectedAnswer: "Carbon Nanotubes",
    sourceDocument: "sample.txt",
    sourceFact: "The secondary material used is Carbon Nanotubes."
  },
  {
    question: "What is the operating temperature range?",
    expectedAnswer: "-50 to 120 degrees Celsius",
    sourceDocument: "sample.pdf",
    sourceFact: "The operating temperature is -50 to 120 degrees Celsius."
  },
  {
    question: "What was the maximum altitude reached?",
    expectedAnswer: "42,000 meters",
    sourceDocument: "sample.docx",
    sourceFact: "The maximum altitude reached was 42,000 meters."
  },
  {
    question: "How many researchers are in the team?",
    expectedAnswer: "3",
    sourceDocument: "sample.csv",
    sourceFact: "The team consists of 14 engineers and 3 researchers."
  },
  {
    question: "What is the mission objective?",
    expectedAnswer: "achieve stable levitation",
    sourceDocument: "sample.md",
    sourceFact: "The mission objective is to achieve stable levitation."
  }
];
