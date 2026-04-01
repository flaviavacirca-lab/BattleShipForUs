// questions.js — Question bank for Battleship Date Night
// Organized by level (1–4). Each question has a unique id.
// To add questions: just append to the appropriate level array with a new unique id.

const QUESTION_BANK = {
  1: [
    // Level 1: Light / Fun (dice 1–2)
    { id: "L1_001", text: "What's a song that always puts you in a good mood?" },
    { id: "L1_002", text: "If you could eat one meal for the rest of your life, what would it be?" },
    { id: "L1_003", text: "What's the most embarrassing thing you've ever Googled?" },
    { id: "L1_004", text: "What's a hobby you'd love to try but haven't yet?" },
    { id: "L1_005", text: "If you could teleport anywhere right now, where would you go?" },
    { id: "L1_006", text: "What's your go-to comfort show?" },
    { id: "L1_007", text: "Would you rather have a personal chef or a personal masseuse?" },
    { id: "L1_008", text: "What's the weirdest food combination you actually enjoy?" },
    { id: "L1_009", text: "If you had to pick a theme song for your life, what would it be?" },
    { id: "L1_010", text: "What's the last thing that made you laugh really hard?" },
    { id: "L1_011", text: "If you could be famous for one thing, what would you want it to be?" },
    { id: "L1_012", text: "What's a movie you could watch over and over?" },
    { id: "L1_013", text: "What's the best gift you've ever received?" },
    { id: "L1_014", text: "If you won the lottery tomorrow, what's the first thing you'd do?" },
    { id: "L1_015", text: "What's a talent you wish you had?" },
    { id: "L1_016", text: "What's your most unpopular opinion about food?" },
    { id: "L1_017", text: "If you could live inside any TV show, which one?" },
    { id: "L1_018", text: "What's the funniest thing that's happened to you recently?" },
    { id: "L1_019", text: "Do you have a guilty pleasure song or artist?" },
    { id: "L1_020", text: "What's the best vacation you've ever taken?" },
    { id: "L1_021", text: "If you could have dinner with any celebrity, who would it be?" },
    { id: "L1_022", text: "What's a random skill you're secretly proud of?" },
    { id: "L1_023", text: "What's the most spontaneous thing you've ever done?" },
    { id: "L1_024", text: "If you could swap lives with someone for a day, who would it be?" },
    { id: "L1_025", text: "What's the best dessert you've ever had?" },
    { id: "L1_026", text: "What's your favorite thing about weekends?" },
    { id: "L1_027", text: "If you could learn any language instantly, which one?" },
    { id: "L1_028", text: "What's a trend you never understood?" },
    { id: "L1_029", text: "What's the best concert or live event you've been to?" },
    { id: "L1_030", text: "What's your ideal lazy day look like?" },
    { id: "L1_031", text: "If you had to eat one cuisine forever, which would it be?" },
    { id: "L1_032", text: "What's the most overrated thing everyone seems to love?" },
    { id: "L1_033", text: "What's a movie you expected to hate but actually loved?" },
    { id: "L1_034", text: "What's your favorite season and why?" },
    { id: "L1_035", text: "If you could instantly become an expert at something, what?" },
    { id: "L1_036", text: "What's the best thing about your morning routine?" },
    { id: "L1_037", text: "What's a place you've never been that you'd love to visit?" },
    { id: "L1_038", text: "What's your go-to karaoke song?" },
    { id: "L1_039", text: "What did you want to be when you were a kid?" },
    { id: "L1_040", text: "What's the best snack of all time?" },
    { id: "L1_041", text: "If you could only listen to one music genre forever, which one?" },
    { id: "L1_042", text: "What's a small thing that always makes your day better?" },
    { id: "L1_043", text: "Would you rather live by the ocean or in the mountains?" },
    { id: "L1_044", text: "What's the most binge-worthy show you've ever watched?" },
    { id: "L1_045", text: "What's the best piece of advice you've ever ignored?" },
    { id: "L1_046", text: "If animals could talk, which one would be the rudest?" },
    { id: "L1_047", text: "What's the weirdest dream you can remember?" },
    { id: "L1_048", text: "What's something you bought that was totally worth it?" },
    { id: "L1_049", text: "What's a dish you make really well?" },
    { id: "L1_050", text: "If you could relive one day of your life just for fun, which one?" },
  ],

  2: [
    // Level 2: Medium / Reflective (dice 3–4)
    { id: "L2_001", text: "What's something you've changed your mind about in the last few years?" },
    { id: "L2_002", text: "What does a perfect day together look like to you?" },
    { id: "L2_003", text: "What's a value you'd never compromise on?" },
    { id: "L2_004", text: "What's something you wish more people understood about you?" },
    { id: "L2_005", text: "What's a relationship lesson you had to learn the hard way?" },
    { id: "L2_006", text: "What does trust mean to you in a relationship?" },
    { id: "L2_007", text: "What's a moment that made you feel genuinely proud of yourself?" },
    { id: "L2_008", text: "How do you like to be shown love?" },
    { id: "L2_009", text: "What's a tradition you'd love for us to start together?" },
    { id: "L2_010", text: "What's something you used to believe about relationships that you don't anymore?" },
    { id: "L2_011", text: "What's the best compliment you've ever received?" },
    { id: "L2_012", text: "What's a dream you haven't talked about much?" },
    { id: "L2_013", text: "When do you feel most like yourself?" },
    { id: "L2_014", text: "What's something that always makes you feel appreciated?" },
    { id: "L2_015", text: "What do you think we're really good at as a couple?" },
    { id: "L2_016", text: "What's something you'd love to learn more about?" },
    { id: "L2_017", text: "What's a small thing I do that means a lot to you?" },
    { id: "L2_018", text: "How do you usually handle stress, and how can I help?" },
    { id: "L2_019", text: "What's a memory from your childhood that shaped who you are?" },
    { id: "L2_020", text: "If money wasn't an issue, how would you spend your time?" },
    { id: "L2_021", text: "What's something you've never told me about your past?" },
    { id: "L2_022", text: "What do you think is the most important thing in a friendship?" },
    { id: "L2_023", text: "What's a goal you're quietly working toward?" },
    { id: "L2_024", text: "When do you feel most connected to me?" },
    { id: "L2_025", text: "What's something you want to get better at this year?" },
    { id: "L2_026", text: "What kind of old person do you want to be?" },
    { id: "L2_027", text: "What's a quality in someone else that you really admire?" },
    { id: "L2_028", text: "What's something I've introduced you to that you're glad you tried?" },
    { id: "L2_029", text: "How do you feel about the pace of our relationship?" },
    { id: "L2_030", text: "What makes a house feel like a home to you?" },
    { id: "L2_031", text: "What role does family play in your life right now?" },
    { id: "L2_032", text: "What's something that energizes you when you're feeling drained?" },
    { id: "L2_033", text: "What does quality time actually look like for you?" },
    { id: "L2_034", text: "Is there a place that feels spiritually or emotionally important to you?" },
    { id: "L2_035", text: "What's something about your personality that's shifted over time?" },
    { id: "L2_036", text: "What's a boundary that's really important to you?" },
    { id: "L2_037", text: "What's a challenge we've handled well together?" },
    { id: "L2_038", text: "What do you think we could work on together?" },
    { id: "L2_039", text: "What's something about me that surprised you?" },
    { id: "L2_040", text: "What does emotional safety look like to you?" },
    { id: "L2_041", text: "How do you feel about where you are in life right now?" },
    { id: "L2_042", text: "What's something that feels unresolved for you?" },
    { id: "L2_043", text: "What's the most meaningful conversation we've had?" },
    { id: "L2_044", text: "What's a habit you'd like to build together?" },
    { id: "L2_045", text: "What part of your routine brings you the most peace?" },
  ],

  3: [
    // Level 3: Deep (dice 5)
    { id: "L3_001", text: "What's something you've been afraid to want?" },
    { id: "L3_002", text: "What does commitment look like to you at this stage of your life?" },
    { id: "L3_003", text: "What's a wound from your past that still affects how you love?" },
    { id: "L3_004", text: "What's the hardest thing about being in a relationship for you?" },
    { id: "L3_005", text: "Is there something you feel like you need from me that you haven't asked for?" },
    { id: "L3_006", text: "What's a part of yourself that you're still learning to accept?" },
    { id: "L3_007", text: "What does growing old together look like in your mind?" },
    { id: "L3_008", text: "What's something about love that scares you?" },
    { id: "L3_009", text: "How do you deal with the fear of losing someone you love?" },
    { id: "L3_010", text: "What's a conversation you think we need to have but haven't?" },
    { id: "L3_011", text: "What are you most proud of about how far you've come?" },
    { id: "L3_012", text: "What does forgiveness mean to you — and when is it hardest?" },
    { id: "L3_013", text: "How has your relationship with yourself changed over the years?" },
    { id: "L3_014", text: "What's something you've never fully processed?" },
    { id: "L3_015", text: "What do you need to feel truly safe with someone?" },
    { id: "L3_016", text: "Is there something you've held back from saying because you didn't want to rock the boat?" },
    { id: "L3_017", text: "What does your inner critic usually tell you?" },
    { id: "L3_018", text: "What's the most important lesson a past relationship taught you?" },
    { id: "L3_019", text: "What are your non-negotiables for the future?" },
    { id: "L3_020", text: "What's a fear you have about us that you haven't voiced?" },
    { id: "L3_021", text: "What would you want me to know if you couldn't explain it gently?" },
    { id: "L3_022", text: "How do you define emotional intimacy?" },
    { id: "L3_023", text: "What does being truly known by someone feel like to you?" },
    { id: "L3_024", text: "What's a truth about yourself that took you a long time to accept?" },
    { id: "L3_025", text: "What's something from your upbringing that you want to do differently?" },
    { id: "L3_026", text: "When you shut down, what's usually going on underneath?" },
    { id: "L3_027", text: "What's something you want more of in your life right now?" },
    { id: "L3_028", text: "What's the most vulnerable thing someone could do for you?" },
    { id: "L3_029", text: "How do you know when you're falling out of alignment with yourself?" },
    { id: "L3_030", text: "What does it take for you to truly let someone in?" },
    { id: "L3_031", text: "What part of your identity feels most misunderstood?" },
    { id: "L3_032", text: "What would you want me to understand about how you love?" },
    { id: "L3_033", text: "What's a hope you carry quietly?" },
    { id: "L3_034", text: "How has your understanding of love evolved?" },
    { id: "L3_035", text: "What makes you feel like you're enough?" },
  ],

  4: [
    // Level 4: Vulnerable (dice 6)
    { id: "L4_001", text: "What's the most honest thing you could say to me right now?" },
    { id: "L4_002", text: "What's something you're terrified of but need to face?" },
    { id: "L4_003", text: "What do you need from me in the moments when you feel most alone?" },
    { id: "L4_004", text: "Have you ever felt like you had to earn love? How did that shape you?" },
    { id: "L4_005", text: "What part of our relationship makes you feel the most exposed?" },
    { id: "L4_006", text: "Is there a version of yourself you've been performing instead of being?" },
    { id: "L4_007", text: "What's the hardest truth you've ever had to tell someone?" },
    { id: "L4_008", text: "What do you carry from your family that you wish you didn't?" },
    { id: "L4_009", text: "When was the last time you cried, and what was it about?" },
    { id: "L4_010", text: "What would you want me to say to you on your worst day?" },
    { id: "L4_011", text: "What's a part of you that you haven't fully shown me yet?" },
    { id: "L4_012", text: "What's the one thing you're most afraid I'll judge you for?" },
    { id: "L4_013", text: "What do you wish someone had told you when you were younger?" },
    { id: "L4_014", text: "Is there a grief you haven't finished grieving?" },
    { id: "L4_015", text: "What would unconditional love look like to you if you really let it in?" },
    { id: "L4_016", text: "What do you need me to be patient with?" },
    { id: "L4_017", text: "What's something you've never forgiven yourself for?" },
    { id: "L4_018", text: "What does your deepest version of happiness look like?" },
    { id: "L4_019", text: "What's a question you've always wanted someone to ask you?" },
    { id: "L4_020", text: "If you could let go of one thing from your past, what would it be?" },
    { id: "L4_021", text: "What part of yourself do you protect the most?" },
    { id: "L4_022", text: "What's the most painful thing about loving deeply?" },
    { id: "L4_023", text: "What would you want me to promise you — not in words, but in action?" },
    { id: "L4_024", text: "What does being held emotionally look like for you?" },
    { id: "L4_025", text: "What's the bravest thing you've ever done in a relationship?" },
    { id: "L4_026", text: "What would it take for you to fully trust that you're loved?" },
    { id: "L4_027", text: "What secret hope do you have for us?" },
    { id: "L4_028", text: "What are you most afraid of never saying out loud?" },
    { id: "L4_029", text: "If you could heal one thing about yourself, what would it be?" },
    { id: "L4_030", text: "What does it feel like when you finally let your guard down?" },
  ]
};

// Level metadata
const LEVEL_INFO = {
  1: { name: "Light & Fun", color: "#4ecdc4", emoji: "✨" },
  2: { name: "Reflective", color: "#ffe66d", emoji: "💭" },
  3: { name: "Deep", color: "#ff6b6b", emoji: "🌊" },
  4: { name: "Vulnerable", color: "#c44dff", emoji: "💜" },
};

// Dice roll to level mapping
function diceToLevel(roll) {
  if (roll <= 2) return 1;
  if (roll <= 4) return 2;
  if (roll === 5) return 3;
  return 4; // roll === 6
}

// Question engine — works with externally managed answered state (Supabase)
class QuestionEngine {
  constructor() {
    this.answered = { D: [], F: [] };
  }

  // Get available questions for a player at a level
  getAvailable(player, level) {
    const all = QUESTION_BANK[level] || [];
    const answeredIds = this.answered[player] || [];
    return all.filter(q => !answeredIds.includes(q.id));
  }

  // Pick a random question for a player at a level
  pickQuestion(player, level) {
    const available = this.getAvailable(player, level);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  // Mark a question as answered by a player (in-memory only; caller persists)
  markAnswered(player, questionId) {
    if (!this.answered[player]) this.answered[player] = [];
    if (!this.answered[player].includes(questionId)) {
      this.answered[player].push(questionId);
    }
  }

  // Get stats for a player
  getStats(player) {
    const stats = {};
    for (let level = 1; level <= 4; level++) {
      const total = QUESTION_BANK[level].length;
      const answeredCount = (this.answered[player] || []).filter(id =>
        QUESTION_BANK[level].some(q => q.id === id)
      ).length;
      stats[level] = { total, answered: answeredCount, remaining: total - answeredCount };
    }
    return stats;
  }

  // Reset progress for a player (in-memory only; caller persists)
  resetPlayer(player) {
    this.answered[player] = [];
  }

  // Reset all progress
  resetAll() {
    this.answered = { D: [], F: [] };
  }

  // Reset progress for a player at a specific level
  resetPlayerLevel(player, level) {
    const levelIds = QUESTION_BANK[level].map(q => q.id);
    this.answered[player] = (this.answered[player] || []).filter(id => !levelIds.includes(id));
  }
}
