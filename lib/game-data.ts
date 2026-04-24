import type { GameQuestion } from "./types";

const defaultQuestions: GameQuestion[] = [
  {
    id: "q1",
    prompt: "Which city anchors the first Damee comic launch story?",
    options: ["Accra", "Lagos", "Kano", "Nairobi"],
    answer: "Lagos",
  },
  {
    id: "q2",
    prompt: "What is the main purpose of the Damee issue quiz loop?",
    options: ["Unlock wallpapers", "Track reading mastery", "Edit comics", "Reset purchases"],
    answer: "Track reading mastery",
  },
  {
    id: "q3",
    prompt: "What kind of stories does Damee Studio prioritize?",
    options: ["Sci-fi only", "European fables", "African and Nigerian stories", "Sports news"],
    answer: "African and Nigerian stories",
  },
];

const questionsByKey: Record<string, GameQuestion[]> = {
  "signal-under-lagos|issue-quiz": [
    {
      id: "q1",
      prompt: "Where is the hidden signal discovered in issue one?",
      options: ["Under Lagos", "Inside Abuja", "At sea", "On a mountain"],
      answer: "Under Lagos",
    },
    {
      id: "q2",
      prompt: "What format does Damee use to expand a story world after comics?",
      options: ["Podcasts only", "Animation and games", "Newspapers", "Radio drama only"],
      answer: "Animation and games",
    },
    {
      id: "q3",
      prompt: "What unlocks referral commission eligibility on an issue?",
      options: [
        "Posting a comment",
        "Owning the same issue",
        "Liking the game page",
        "Watching a trailer",
      ],
      answer: "Owning the same issue",
    },
  ],
};

export function getQuestionsForGame(issueSlug: string | undefined, gameSlug: string) {
  if (!issueSlug) return defaultQuestions;
  return questionsByKey[`${issueSlug}|${gameSlug}`] ?? defaultQuestions;
}
