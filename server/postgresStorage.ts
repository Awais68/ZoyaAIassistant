import { Pool } from 'pg';
import { IStorage, MemStorage } from './storage';
import { randomUUID } from 'crypto';

// Minimal Postgres-backed storage for tasks and command history.
// Other methods delegate to the provided MemStorage fallback.

export class PostgresStorage implements IStorage {
    private pool: Pool;
    private fallback: MemStorage;

    constructor(databaseUrl: string, fallback: MemStorage) {
        this.pool = new Pool({ connectionString: databaseUrl, max: 5 });
        this.fallback = fallback;
        this.init().catch((e) => console.error('PostgresStorage init error:', e));
    }

    private async init() {
        // Create tables if they don't exist (id as uuid text, created_at timestamp)
        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT false,
        priority TEXT,
        due_date TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL
      );
    `);

        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS command_history (
        id TEXT PRIMARY KEY,
        input TEXT NOT NULL,
        response TEXT,
        language TEXT,
        input_type TEXT,
        status TEXT,
        created_at TIMESTAMP NOT NULL
      );
    `);
    }

    // Users - delegate to fallback
    async getUser(id: string) { return this.fallback.getUser(id); }
    async getUserByUsername(username: string) { return this.fallback.getUserByUsername(username); }
    async createUser(user: any) { return this.fallback.createUser(user); }

    // Emails - delegate
    async getEmails() { return this.fallback.getEmails(); }
    async getUnreadEmails() { return this.fallback.getUnreadEmails(); }
    async createEmail(email: any) { return this.fallback.createEmail(email); }
    async markEmailAsRead(id: string) { return this.fallback.markEmailAsRead(id); }

    // Calendar - delegate
    async getCalendarEvents() { return this.fallback.getCalendarEvents(); }
    async getTodayEvents() { return this.fallback.getTodayEvents(); }
    async getUpcomingEvents() { return this.fallback.getUpcomingEvents(); }
    async createCalendarEvent(event: any) { return this.fallback.createCalendarEvent(event); }
    async deleteCalendarEvent(id: string) { return this.fallback.deleteCalendarEvent(id); }

    // Tasks - persist to Postgres
    async getTasks() {
        const res = await this.pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        return res.rows.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            completed: r.completed,
            priority: r.priority,
            dueDate: r.due_date,
            createdAt: r.created_at,
        }));
    }

    async getPendingTasks() {
        const res = await this.pool.query('SELECT * FROM tasks WHERE completed = false ORDER BY COALESCE(due_date, to_timestamp(0)) ASC, created_at DESC');
        return res.rows.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            completed: r.completed,
            priority: r.priority,
            dueDate: r.due_date,
            createdAt: r.created_at,
        }));
    }

    async createTask(insertTask: any) {
        const id = randomUUID();
        const created_at = new Date();
        await this.pool.query(
            `INSERT INTO tasks(id, title, description, completed, priority, due_date, created_at) VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [id, insertTask.title, insertTask.description || '', insertTask.completed || false, insertTask.priority || null, insertTask.dueDate || null, created_at]
        );
        return {
            id,
            title: insertTask.title,
            description: insertTask.description || '',
            completed: insertTask.completed || false,
            priority: insertTask.priority || 'medium',
            dueDate: insertTask.dueDate || undefined,
            createdAt: created_at,
        };
    }

    async updateTask(id: string, updates: Partial<any>) {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [k, v] of Object.entries(updates)) {
            if (k === 'dueDate') {
                fields.push(`due_date=$${idx}`);
                values.push(v);
            } else if (k === 'createdAt') continue;
            else {
                fields.push(`${k}=$${idx}`);
                values.push(v);
            }
            idx++;
        }
        if (fields.length === 0) return this.getTasks().then(ts => ts.find(t => t.id === id));
        values.push(id);
        const q = `UPDATE tasks SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`;
        const res = await this.pool.query(q, values);
        if (res.rowCount === 0) return undefined;
        const r = res.rows[0];
        return {
            id: r.id,
            title: r.title,
            description: r.description,
            completed: r.completed,
            priority: r.priority,
            dueDate: r.due_date,
            createdAt: r.created_at,
        };
    }

    async deleteTask(id: string) {
        await this.pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    }

    // Reminders - delegate
    async getReminders() { return this.fallback.getReminders(); }
    async getActiveReminders() { return this.fallback.getActiveReminders(); }
    async createReminder(reminder: any) { return this.fallback.createReminder(reminder); }
    async deactivateReminder(id: string) { return this.fallback.deactivateReminder(id); }

    // Command history - persist
    async getCommandHistory() {
        const res = await this.pool.query('SELECT * FROM command_history ORDER BY created_at DESC');
        return res.rows.map(r => ({
            id: r.id,
            input: r.input,
            response: r.response,
            language: r.language,
            inputType: r.input_type,
            status: r.status,
            createdAt: r.created_at,
        }));
    }

    async createCommandHistory(insertCommand: any) {
        const id = randomUUID();
        const created_at = new Date();
        await this.pool.query(`INSERT INTO command_history(id,input,response,language,input_type,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [id, insertCommand.input, insertCommand.response || null, insertCommand.language || null, insertCommand.inputType || null, insertCommand.status || null, created_at]
        );
        return {
            id,
            input: insertCommand.input,
            response: insertCommand.response || null,
            language: insertCommand.language || null,
            inputType: insertCommand.inputType || null,
            status: insertCommand.status || null,
            createdAt: created_at,
        };
    }

    async clearCommandHistory() {
        await this.pool.query('DELETE FROM command_history');
    }
}
