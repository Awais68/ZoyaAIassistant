import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sender: text("sender").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendees: text("attendees").array(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  priority: text("priority").default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  reminderTime: timestamp("reminder_time").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commandHistory = pgTable("command_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  input: text("input").notNull(),
  response: text("response").notNull(),
  language: text("language").notNull(), // en, ur, roman-ur
  inputType: text("input_type").notNull(), // voice, text
  status: text("status").default("completed"), // completed, failed, processing
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertCommandHistorySchema = createInsertSchema(commandHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type CommandHistory = typeof commandHistory.$inferSelect;
export type InsertCommandHistory = z.infer<typeof insertCommandHistorySchema>;
