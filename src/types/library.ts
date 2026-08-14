export interface LibraryTask {
  id: string;
  title: string;
  description: string;
  className: string;
  classList?: string[];
  bookId?: string;
  assignedBy: string;
  assignedByName?: string;
  status: "ACTIVE" | "CLOSED";
  dueDate?: string;
  points?: number;
  durationMinutes?: number;
  startAt?: number;
  endAt?: number;
  createdAt: number;
  updatedAt: number;
}
