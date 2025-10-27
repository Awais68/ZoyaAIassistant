import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { processNaturalLanguageCommand, generateEmailContent, summarizeEmails } from "./services/gemini";
import { insertEmailSchema, insertCalendarEventSchema, insertTaskSchema, insertReminderSchema, insertCommandHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    connectedClients.add(ws);

    ws.on('close', () => {
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Dashboard API routes
  app.get("/api/dashboard", async (req, res) => {
    try {
      const [todayEvents, unreadEmails, pendingTasks, recentCommands] = await Promise.all([
        storage.getTodayEvents(),
        storage.getUnreadEmails(),
        storage.getPendingTasks(),
        storage.getCommandHistory()
      ]);

      const nextMeeting = todayEvents.find(event => new Date(event.startTime) > new Date());

      res.json({
        todayMeetings: todayEvents.length,
        unreadEmails: unreadEmails.length,
        pendingTasks: pendingTasks.length,
        nextMeeting: nextMeeting ? {
          title: nextMeeting.title,
          time: `${new Date(nextMeeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(nextMeeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } : null,
        upcomingEvents: todayEvents.slice(0, 5),
        recentEmails: unreadEmails.slice(0, 5),
        recentTasks: pendingTasks.slice(0, 5),
        commandHistory: recentCommands.slice(0, 10)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Email routes
  app.get("/api/emails", async (req, res) => {
    try {
      const emails = await storage.getEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.get("/api/emails/unread", async (req, res) => {
    try {
      const emails = await storage.getUnreadEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread emails" });
    }
  });

  app.post("/api/emails", async (req, res) => {
    try {
      const validatedData = insertEmailSchema.parse(req.body);
      const email = await storage.createEmail(validatedData);
      broadcastUpdate('email_created', email);
      res.json(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid email data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create email" });
      }
    }
  });

  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      await storage.markEmailAsRead(req.params.id);
      broadcastUpdate('email_read', { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  // Calendar routes
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/today", async (req, res) => {
    try {
      const events = await storage.getTodayEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's events" });
    }
  });

  app.post("/api/calendar/events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      broadcastUpdate('event_created', event);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });

  app.delete("/api/calendar/events/:id", async (req, res) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      broadcastUpdate('event_deleted', { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/pending", async (req, res) => {
    try {
      const tasks = await storage.getPendingTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      broadcastUpdate('task_created', task);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (task) {
        broadcastUpdate('task_updated', task);
        res.json(task);
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      broadcastUpdate('task_deleted', { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Reminders routes
  app.get("/api/reminders", async (req, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const validatedData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(validatedData);
      broadcastUpdate('reminder_created', reminder);
      res.json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reminder" });
      }
    }
  });

  // Command History routes
  app.get("/api/commands/history", async (req, res) => {
    try {
      const commands = await storage.getCommandHistory();
      res.json(commands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch command history" });
    }
  });

  app.delete("/api/commands/history", async (req, res) => {
    try {
      await storage.clearCommandHistory();
      broadcastUpdate('history_cleared', {});
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear command history" });
    }
  });

  // AI Command Processing
  app.post("/api/commands/process", async (req, res) => {
    try {
      const { input, language = "en", inputType = "text" } = req.body;

      if (!input || typeof input !== "string") {
        return res.status(400).json({ message: "Invalid input" });
      }

      // Process with OpenAI
      const aiResponse = await processNaturalLanguageCommand(input, language);

      let executionResult = null;
      let status = "completed";

      // Execute the command based on the intent
      try {
        switch (aiResponse.intent.action) {
          case "schedule_meeting":
            if (aiResponse.intent.parameters.title && aiResponse.intent.parameters.startTime) {
              const event = await storage.createCalendarEvent({
                title: aiResponse.intent.parameters.title,
                description: aiResponse.intent.parameters.description || "",
                startTime: new Date(aiResponse.intent.parameters.startTime),
                endTime: new Date(aiResponse.intent.parameters.endTime ||
                  new Date(new Date(aiResponse.intent.parameters.startTime).getTime() + 60 * 60 * 1000)),
                attendees: aiResponse.intent.parameters.attendees || [],
                location: aiResponse.intent.parameters.location || "Virtual",
              });
              executionResult = event;
              broadcastUpdate('event_created', event);
            }
            break;

          case "create_task":
            if (aiResponse.intent.parameters.title) {
              const task = await storage.createTask({
                title: aiResponse.intent.parameters.title,
                description: aiResponse.intent.parameters.description || "",
                priority: aiResponse.intent.parameters.priority || "medium",
                dueDate: aiResponse.intent.parameters.dueDate ?
                  new Date(aiResponse.intent.parameters.dueDate) : undefined,
              });
              executionResult = task;
              aiResponse.response = `Task created successfully: "${task.title}"`;
              broadcastUpdate('task_created', task);
            }
            break;

          case "set_reminder":
            if (aiResponse.intent.parameters.title && aiResponse.intent.parameters.reminderTime) {
              const reminder = await storage.createReminder({
                title: aiResponse.intent.parameters.title,
                description: aiResponse.intent.parameters.description || "",
                reminderTime: new Date(aiResponse.intent.parameters.reminderTime),
              });
              executionResult = reminder;
              broadcastUpdate('reminder_created', reminder);
            }
            break;

          case "check_calendar":
            const calendarEvents = await storage.getTodayEvents();
            executionResult = calendarEvents;
            // Enhance the response to include event details
            if (calendarEvents && calendarEvents.length > 0) {
              const eventList = calendarEvents.slice(0, 3).map((e: any) =>
                `${e.title} at ${new Date(e.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              ).join(', ');
              aiResponse.response = `You have ${calendarEvents.length} event(s) today: ${eventList}${calendarEvents.length > 3 ? '...' : ''}`;
            } else {
              aiResponse.response = "You have no events scheduled for today.";
            }
            break;

          case "check_emails":
            const unreadEmails = await storage.getUnreadEmails();
            executionResult = unreadEmails;
            // Enhance the response to include email count
            if (unreadEmails && unreadEmails.length > 0) {
              aiResponse.response = `You have ${unreadEmails.length} unread email(s). The most recent is from ${unreadEmails[0].sender}: "${unreadEmails[0].subject}"`;
            } else {
              aiResponse.response = "You have no unread emails.";
            }
            break;

          case "check_tasks":
            const allTasks = await storage.getTasks();
            executionResult = allTasks;
            // Enhance the response to include task details
            if (allTasks && allTasks.length > 0) {
              const pendingTasks = allTasks.filter((t: any) => t.status === 'pending');
              if (pendingTasks.length > 0) {
                const taskList = pendingTasks.slice(0, 3).map((t: any) =>
                  `${t.title}${t.priority ? ` (${t.priority})` : ''}`
                ).join(', ');
                aiResponse.response = `You have ${pendingTasks.length} pending task(s): ${taskList}${pendingTasks.length > 3 ? '...' : ''}`;
              } else {
                aiResponse.response = "All your tasks are completed! Great job!";
              }
            } else {
              aiResponse.response = "You have no tasks. Would you like to create one?";
            }
            break;

          case "summarize_emails":
            const emailsToSummarize = await storage.getUnreadEmails();
            const emailSummary = await summarizeEmails(
              emailsToSummarize.map(e => ({ subject: e.subject, content: e.content, sender: e.sender })),
              language
            );
            executionResult = { summary: emailSummary, emailCount: emailsToSummarize.length };
            break;

          default:
            status = "processed";
            break;
        }
      } catch (executionError) {
        console.error("Command execution error:", executionError);
        status = "failed";
      }

      // Log command to history
      const command = await storage.createCommandHistory({
        input,
        response: aiResponse.response,
        language: aiResponse.language,
        inputType,
        status,
      });

      broadcastUpdate('command_executed', {
        command,
        result: executionResult,
        aiResponse
      });

      res.json({
        success: true,
        response: aiResponse.response,
        language: aiResponse.language,
        intent: aiResponse.intent,
        result: executionResult,
        command
      });

    } catch (error) {
      console.error("Command processing error:", error);
      res.status(500).json({ message: "Failed to process command" });
    }
  });

  // Email actions
  app.post("/api/emails/summarize", async (req, res) => {
    try {
      const { language = "en" } = req.body;
      const emails = await storage.getUnreadEmails();
      const summary = await summarizeEmails(
        emails.map(e => ({ subject: e.subject, content: e.content, sender: e.sender })),
        language
      );
      res.json({ summary, emailCount: emails.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to summarize emails" });
    }
  });

  app.post("/api/emails/generate", async (req, res) => {
    try {
      const { subject, context, language = "en" } = req.body;
      const content = await generateEmailContent(subject, context, language);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate email content" });
    }
  });

  return httpServer;
}
