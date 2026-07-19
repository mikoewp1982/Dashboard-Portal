export interface DailySchedule {
  dayId: number; // 0=Sunday, 1=Monday, ...
  dayName: string;
  isEnabled: boolean;
  entryTime: string;
  exitTime: string;
}

export interface Holiday {
  id: string;
  date: string;
  description: string;
}

export interface SchoolLocation {
  latitude: number;
  longitude: number;
  radius: number;
}
