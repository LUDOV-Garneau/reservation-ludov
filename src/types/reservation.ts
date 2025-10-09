export interface Reservation {
  id: string;
  user_id: number;
  console_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  station_id: number | null;
  accessoir_id: number | null;
  cours: number | null;
  expireAt: Date;
  date: Date | null;
  time: string | null;
  createdAt: Date;
}
