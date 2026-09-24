import type { Position } from "@/generated/prisma/enums";

/**
 * Seniority rank drives room allocation: higher rank gets the better room type
 * and is never bunked below its band. It is also the admin filter order.
 *
 * The ladder follows the order the house supplied its roles in, lowest first.
 * If that ordering is wrong, correcting the numbers here is all that's needed,
 * nothing else reads the hierarchy.
 */
export const POSITION_RANK: Record<Position, number> = {
  DISCIPLE: 5,
  POWER_4_LEADER: 10,
  // TEAM_LEADER is now shown as "Team Co-ordinator" and shares the rank of the
  // original TEAM_COORDINATOR, so a room reserved for one admits the other.
  TEAM_LEADER: 30,
  TEAM_COORDINATOR: 30,
  CAPTAIN: 40,
  DIRECTOR: 50,
  MINISTER: 60,
  CAMPUS_PASTOR: 70,
  PASTOR: 80,
  LIGHTHOUSE_PASTOR: 90,
  DIRECTOR_OF_MISSION: 100,
  SENIOR_PASTOR: 110,
};

export const POSITION_LABEL: Record<Position, string> = {
  DISCIPLE: "Disciple",
  POWER_4_LEADER: "Sub Team Leader",
  TEAM_LEADER: "Team Co-ordinator",
  TEAM_COORDINATOR: "Team Co-ordinator",
  CAPTAIN: "Captain",
  DIRECTOR: "Director",
  MINISTER: "Minister",
  CAMPUS_PASTOR: "Campus Pastor",
  PASTOR: "Pastor",
  LIGHTHOUSE_PASTOR: "LightHouse Pastor",
  DIRECTOR_OF_MISSION: "Director Of Mission",
  SENIOR_PASTOR: "Senior Pastor",
};

/**
 * Ordered for <select> menus, in the order the house lists them. The original
 * TEAM_COORDINATOR is left out: TEAM_LEADER took over the "Team Co-ordinator"
 * name, and offering both would show the same label twice.
 */
export const POSITION_OPTIONS: Position[] = [
  "DISCIPLE",
  "POWER_4_LEADER",
  "TEAM_LEADER",
  "CAPTAIN",
  "DIRECTOR",
  "MINISTER",
  "CAMPUS_PASTOR",
  "PASTOR",
  "LIGHTHOUSE_PASTOR",
  "DIRECTOR_OF_MISSION",
  "SENIOR_PASTOR",
];

/** Pastoral roles, the band that gets the small and private rooms. */
export function isPastoral(position: Position) {
  return POSITION_RANK[position] >= POSITION_RANK.CAMPUS_PASTOR;
}
