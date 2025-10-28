import {
  type User,
  type InsertUser,
  type Email,
  type InsertEmail,
  type CalendarEvent,
  type InsertCalendarEvent,
  type Task,
  type InsertTask,
  type Reminder,
  type InsertReminder,
  type CommandHistory,
  type InsertCommandHistory
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Emails
  getEmails(): Promise<Email[]>;
  getUnreadEmails(): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  markEmailAsRead(id: string): Promise<void>;

  // Calendar Events
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getTodayEvents(): Promise<CalendarEvent[]>;
  getUpcomingEvents(): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getPendingTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  // Reminders
  getReminders(): Promise<Reminder[]>;
  getActiveReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  deactivateReminder(id: string): Promise<void>;

  // Command History
  getCommandHistory(): Promise<CommandHistory[]>;
  createCommandHistory(command: InsertCommandHistory): Promise<CommandHistory>;
  clearCommandHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emails: Map<string, Email>;
  private calendarEvents: Map<string, CalendarEvent>;
  private tasks: Map<string, Task>;
  private reminders: Map<string, Reminder>;
  private commandHistory: Map<string, CommandHistory>;

  constructor() {
    this.users = new Map();
    this.emails = new Map();
    this.calendarEvents = new Map();
    this.tasks = new Map();
    this.reminders = new Map();
    this.commandHistory = new Map();

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Sample emails
    const sampleEmails: InsertEmail[] = [
      {
        sender: "Sarah Johnson",
        recipient: "user@company.com",
        subject: "Project Timeline Update",
        content: "Hi! I wanted to update you on the project timeline. We've made good progress and should be able to deliver on schedule.",
        isRead: false,
      },
      {
        sender: "Marketing Team",
        recipient: "user@company.com",
        subject: "Monthly Report Ready",
        content: "The monthly marketing report is ready for review. Please find the attached document with all the key metrics.",
        isRead: false,
      },
      {
        sender: "Alex Chen",
        recipient: "user@company.com",
        subject: "Meeting Reschedule Request",
        content: "Could we please reschedule our meeting to tomorrow? Something urgent came up that needs my immediate attention.",
        isRead: false,
      },
    ];

    for (const email of sampleEmails) {
      await this.createEmail(email);
    }

    // Sample calendar events
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sampleEvents: InsertCalendarEvent[] = [
      {
        title: "Team Standup with Development Team",
        description: "Daily standup meeting",
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM today
        endTime: new Date(today.getTime() + 14.5 * 60 * 60 * 1000), // 2:30 PM today
        attendees: ["Development Team"],
        location: "Conference Room A",
      },
      {
        title: "Client Meeting - Project Review",
        description: "Review project progress with client",
        startTime: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 3:30 PM today
        endTime: new Date(today.getTime() + 16.5 * 60 * 60 * 1000), // 4:30 PM today
        attendees: ["Client", "Project Manager"],
        location: "Meeting Room B",
      },
      {
        title: "Weekly Team Sync",
        description: "Weekly team synchronization meeting",
        startTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5 PM today
        endTime: new Date(today.getTime() + 17.5 * 60 * 60 * 1000), // 5:30 PM today
        attendees: ["Team"],
        location: "Virtual",
      },
    ];

    for (const event of sampleEvents) {
      await this.createCalendarEvent(event);
    }

    // Sample tasks
    const sampleTasks: InsertTask[] = [
      {
        title: "Review client proposal document",
        description: "Review and provide feedback on the new client proposal",
        completed: false,
        priority: "high",
        dueDate: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM today
      },
      {
        title: "Send meeting notes to team",
        description: "Send notes from today's meeting to all team members",
        completed: true,
        priority: "medium",
        dueDate: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: "Prepare Q4 budget presentation",
        description: "Prepare the quarterly budget presentation for management",
        completed: false,
        priority: "medium",
        dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      },
    ];

    for (const task of sampleTasks) {
      await this.createTask(task);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Emails
  async getEmails(): Promise<Email[]> {
    return Array.from(this.emails.values()).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getUnreadEmails(): Promise<Email[]> {
    return Array.from(this.emails.values())
      .filter(email => !email.isRead)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = randomUUID();
    const email: Email = {
      ...insertEmail,
      id,
      createdAt: new Date()
    };
    this.emails.set(id, email);
    return email;
  }

  async markEmailAsRead(id: string): Promise<void> {
    const email = this.emails.get(id);
    if (email) {
      email.isRead = true;
      this.emails.set(id, email);
    }
  }

  // Calendar Events
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return Array.from(this.calendarEvents.values())
      .filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= todayStart && eventDate < todayEnd;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async getUpcomingEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    return Array.from(this.calendarEvents.values())
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 10);
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      createdAt: new Date()
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    this.calendarEvents.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getPendingTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => !task.completed)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      });
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (task) {
      const updatedTask = { ...task, ...updates };
      this.tasks.set(id, updatedTask);
      return updatedTask;
    }
    return undefined;
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).sort((a, b) =>
      new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime()
    );
  }

  async getActiveReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.isActive)
      .sort((a, b) => new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime());
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: new Date()
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async deactivateReminder(id: string): Promise<void> {
    const reminder = this.reminders.get(id);
    if (reminder) {
      reminder.isActive = false;
      this.reminders.set(id, reminder);
    }
  }

  // Command History
  async getCommandHistory(): Promise<CommandHistory[]> {
    return Array.from(this.commandHistory.values()).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createCommandHistory(insertCommand: InsertCommandHistory): Promise<CommandHistory> {
    const id = randomUUID();
    const command: CommandHistory = {
      ...insertCommand,
      id,
      createdAt: new Date()
    };
    this.commandHistory.set(id, command);
    return command;
  }

  async clearCommandHistory(): Promise<void> {
    this.commandHistory.clear();
  }
}

// Export MemStorage for use as a fallback by PostgresStorage
export const memStorage = new MemStorage();

// Dynamically select storage backend. If a DATABASE_URL environment variable
// is provided, use PostgresStorage (persisting tasks and command history).
// Otherwise fall back to the in-memory implementation.
let selectedStorage: IStorage = memStorage;
if (process.env.DATABASE_URL) {
  try {
    // Lazy import to avoid adding pg dependency during environments that don't need it
    // (but here we already installed pg). Import PostgresStorage and instantiate.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PostgresStorage } = require('./postgresStorage');
    selectedStorage = new PostgresStorage(process.env.DATABASE_URL, memStorage) as IStorage;
    console.log('Using PostgresStorage for persistent tasks and command history');
  } catch (err) {
    console.warn('Failed to initialize PostgresStorage, falling back to memStorage:', err);
    selectedStorage = memStorage;
  }
}

export const storage: IStorage = selectedStorage;
