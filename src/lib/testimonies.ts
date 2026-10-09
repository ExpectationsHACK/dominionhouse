/**
 * Fresh Fire testimonies, in the words of the people who lived them. Shown on
 * /camp until testimonies are added at /admin/content (Testimonials), which
 * then replace this list.
 *
 * `quote` is a line lifted verbatim from the testimony, for the card; the full
 * story opens on request. Paragraphs are kept as written.
 */
export type Testimony = {
  id: string;
  name: string;
  /** The camp it happened at, e.g. "Fresh Fire 2020". */
  camp: string;
  title: string;
  quote: string;
  story: string[];
  imageUrl: string;
};

export const TESTIMONIES: Testimony[] = [
  {
    id: "victoria-allwell",
    name: "Victoria Allwell",
    camp: "Fresh Fire 2020",
    title: "Healed of a peptic ulcer",
    quote:
      "From FFC 2020 to today, 2026, I have not had a single day of that pain.",
    imageUrl: "/testimonies/victoria-allwell.jpg",
    story: [
      "In 2020, I had my first experience at FFC, Fresh Fire Camp. I was elated, and everything about it was truly worth the while.",
      "But that same season, I was diagnosed with peptic ulcer. I thought it was something simple, but I was wrong. The doctor's instruction was that whenever I felt pain, I must eat and take my drugs. I assumed it would just mean eating morning, afternoon, and night, but the truth was far from that. I was in pain every single hour, which meant I had to eat and take my drugs every hour. It felt like drug abuse. I could hardly bear it, and I was embarrassed by it all. I knew something had to be done, but I didn't know what. So I held on to the doctor's instructions and kept eating and taking my drugs hourly, right up until FFC 2020.",
      "That was where my turning point began.",
      "On the first day of camp, I was still searching for food every hour and taking my drugs every hour. But on the second day, we were called to pray. We were told to hold our posture and pray fervently, and I did. I prayed so deeply that I ended up on the floor for a while. Afterwards, I was simply reflecting on the beauty of what I had just experienced, when someone walked up to me and asked, \"Should I get you your food?\"",
      "I was stunned. Me? The one who was always looking for food because of the pain? And then I realized I couldn't feel any pain at all. I knew my healing had come.",
      "Still, I stayed watchful. All through that day, I waited to see if the pain would return. It never did. I woke up the next morning completely sure I was healed. I picked up my drugs and threw them away, because God had finished His work in my body.",
      "That was the last time I ever experienced it. From FFC 2020 to today, 2026, I have not had a single day of that pain.",
      "Isn't God beautiful? I love Him so much. Thank you, Jesus!",
    ],
  },
  {
    id: "busayo-shofuyi",
    name: "Busayo Shofuyi",
    camp: "Fresh Fire 2023",
    title: "A date with destiny",
    quote: "It was just 4 days, but those 4 days totally changed my life.",
    imageUrl: "/testimonies/busayo-shofuyi.jpg",
    story: [
      "My first experience at Fresh Fire Camp Meeting was supernatural!",
      "Honestly, I had never experienced the move of God's Spirit like that before. This was my first Fresh Fire Camp Meeting and I came in just growing spiritually, but that weekend showed me there is MORE to my life.",
      "It was just 4 days, but those 4 days totally changed my life.",
      "The prayer... the Word... the visions I got for my life. Everything was different. I could literally feel God saying there was more to my life.",
      "That was the first time it became real to me that I was “called” to ministry.",
      "I went back to my IT posting with a passion to take that campus, started leading and teaching people.",
      "I can boldly say that's where my spiritual growth took a new turn. It was not just a camp meeting for me, it was really a date with destiny. I left there changed, and I’ve never remained the same ever since.",
    ],
  },
  {
    id: "precious-oguntoye",
    name: "Precious Oguntoye",
    camp: "Fresh Fire 2023",
    title: "Direction for a new year",
    quote:
      "After the camp, I received several instructions, and I knew exactly what to do.",
    imageUrl: "/testimonies/precious-oguntoye.jpg",
    story: [
      "My experience at the Fresh Fire Camp Meeting is always amazing and unforgettable.",
      "I remember my first camp meeting in 2023. I encountered the power of God and experienced the move of the Spirit through the Word, prayers, and impartation. That experience led me to become a committed disciple in the house.",
      "Since then, I have always looked forward to attending the next camp meeting.",
      "Fast-forward to 2026, I needed direction for my new year and clarity on what to do. I knew there were many things I needed answers and direction for, but I also knew that attending the Fresh Fire Camp Meeting was exactly what I needed. And truly, after the camp, I received several instructions, and I knew exactly what to do.",
      "Just like the name implies, Fresh Fire Camp Meeting is always a time of activation, impartation, fresh fire, and an outpouring of the Spirit. 🔥",
      "Every experience has been unique, impactful, and transformative, and I am grateful for all that God continues to do through this meeting.",
      "I can't wait for Fresh Fire Camp Meeting 2027! 🔥🙌",
    ],
  },
  {
    id: "divine-felix",
    name: "Divine Felix",
    camp: "Fresh Fire 2024",
    title: "Free from the fear of hell",
    quote: "I wasn't trying to escape hell anymore; I knew that I had eternal life in Christ.",
    imageUrl: "/testimonies/divine-felix.jpg",
    story: [
      "I went to Fresh Fire Camp with a deep fear of going to hell. I genuinely thought I wasn't going to make heaven. I was afraid that no matter what I did, I might still not be good enough.",
      "Then Pastor Vincent taught about salvation during the Fresh Fire Camp Meeting. I believed that eternal life is given to the one who believes in Jesus, that salvation is found in Christ, not in my ability to make myself worthy.",
      "For the first time, I began to understand the simplicity and assurance of the gospel. I realized that Jesus had already done what I could never do for myself.",
      "And I believed the gospel that day and something changed in me: the fear of hell left. I wasn't trying to escape hell anymore; I knew that I had eternal life in Christ.",
    ],
  },
];
