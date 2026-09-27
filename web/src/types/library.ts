export interface LibraryTask {
  id: string;
  title: string;
  description: string;
  className: string;
  classList?: string[];
  startAt?: number;
  endAt?: number;
  bookId?: string;
  assignedBy: string;
  assignedByName?: string;
  status: "ACTIVE" | "CLOSED";
  dueDate?: string;
  points?: number;
  durationMinutes?: number;
  createdAt: number;
  updatedAt: number;
}
