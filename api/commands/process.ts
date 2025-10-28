import { VercelRequest, VercelResponse } from '@vercel/node';

// We import the Gemini service lazily inside the handler to avoid module-evaluation
// errors on serverless platforms when environment variables (like GEMINI_API_KEY)
// are missing. This ensures the function can still start and return graceful
// fallback responses.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { input, language = 'en' } = req.body;

        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input: must be a non-empty string',
            });
        }

        // Lazy import the Gemini service so missing env vars don't crash the function
        const gemini = await import('../../server/services/gemini');
        const processNaturalLanguageCommand = gemini.processNaturalLanguageCommand as (
            input: string,
            language?: string
        ) => Promise<any>;

        // If import or function resolution failed, return a clear error
        if (typeof processNaturalLanguageCommand !== 'function') {
            console.error('Gemini service unavailable or not exported correctly');
            return res.status(500).json({ success: false, error: 'AI service unavailable' });
        }

        // Process the command (intent detection)
        const aiResponse = await processNaturalLanguageCommand(input, language);

        // Execute the action where possible using the in-memory storage implementation.
        // Note: On Vercel serverless, SQLite/persistent DB is not available. This uses
        // the project's `MemStorage` (in `server/storage.ts`) which is ephemeral but
        // provides basic functionality while deployed as serverless functions.
        const storageModule = await import('../../server/storage');
        const storage = storageModule.storage;

        let executionResult: any = null;
        let status: string = 'completed';

        try {
            switch (aiResponse.intent.action) {
                case 'schedule_meeting':
                    if (aiResponse.intent.parameters.title && aiResponse.intent.parameters.startTime) {
                        const event = await storage.createCalendarEvent({
                            title: aiResponse.intent.parameters.title,
                            description: aiResponse.intent.parameters.description || '',
                            startTime: new Date(aiResponse.intent.parameters.startTime),
                            endTime: new Date(aiResponse.intent.parameters.endTime || (new Date(new Date(aiResponse.intent.parameters.startTime).getTime() + 60 * 60 * 1000))),
                            attendees: aiResponse.intent.parameters.attendees || [],
                            location: aiResponse.intent.parameters.location || 'Virtual',
                        });
                        executionResult = event;
                    }
                    break;

                case 'create_task':
                    if (aiResponse.intent.parameters.title) {
                        const task = await storage.createTask({
                            title: aiResponse.intent.parameters.title,
                            description: aiResponse.intent.parameters.description || '',
                            priority: aiResponse.intent.parameters.priority || 'medium',
                            dueDate: aiResponse.intent.parameters.dueDate ? new Date(aiResponse.intent.parameters.dueDate) : undefined,
                        });
                        executionResult = task;
                        aiResponse.response = `Task created successfully: "${task.title}"`;
                    }
                    break;

                case 'set_reminder':
                    if (aiResponse.intent.parameters.title && aiResponse.intent.parameters.reminderTime) {
                        const reminder = await storage.createReminder({
                            title: aiResponse.intent.parameters.title,
                            description: aiResponse.intent.parameters.description || '',
                            reminderTime: new Date(aiResponse.intent.parameters.reminderTime),
                        });
                        executionResult = reminder;
                    }
                    break;

                case 'check_calendar':
                    const calendarEvents = await storage.getTodayEvents();
                    executionResult = calendarEvents;
                    if (calendarEvents && calendarEvents.length > 0) {
                        const eventList = calendarEvents.slice(0, 3).map((e: any) =>
                            `${e.title} at ${new Date(e.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                        ).join(', ');
                        aiResponse.response = `You have ${calendarEvents.length} event(s) today: ${eventList}${calendarEvents.length > 3 ? '...' : ''}`;
                    } else {
                        aiResponse.response = 'You have no events scheduled for today.';
                    }
                    break;

                case 'check_emails':
                    const unreadEmails = await storage.getUnreadEmails();
                    executionResult = unreadEmails;
                    if (unreadEmails && unreadEmails.length > 0) {
                        aiResponse.response = `You have ${unreadEmails.length} unread email(s). The most recent is from ${unreadEmails[0].sender}: "${unreadEmails[0].subject}"`;
                    } else {
                        aiResponse.response = 'You have no unread emails.';
                    }
                    break;

                case 'check_tasks':
                    const allTasks = await storage.getTasks();
                    executionResult = allTasks;
                    if (allTasks && allTasks.length > 0) {
                        const pendingTasks = allTasks.filter((t: any) => !t.completed);
                        if (pendingTasks.length > 0) {
                            const taskList = pendingTasks.slice(0, 3).map((t: any) => `${t.title}${t.priority ? ` (${t.priority})` : ''}`).join(', ');
                            aiResponse.response = `You have ${pendingTasks.length} pending task(s): ${taskList}${pendingTasks.length > 3 ? '...' : ''}`;
                        } else {
                            aiResponse.response = 'All your tasks are completed! Great job!';
                        }
                    } else {
                        aiResponse.response = 'You have no tasks. Would you like to create one?';
                    }
                    break;

                case 'summarize_emails':
                    const emailsToSummarize = await storage.getUnreadEmails();
                    const geminiModule = gemini;
                    const emailSummary = await (geminiModule.summarizeEmails ? geminiModule.summarizeEmails(
                        emailsToSummarize.map((e: any) => ({ subject: e.subject, content: e.content, sender: e.sender })),
                        language
                    ) : Promise.resolve(''));
                    executionResult = { summary: emailSummary, emailCount: emailsToSummarize.length };
                    break;

                default:
                    status = 'processed';
                    break;
            }
        } catch (executionError) {
            console.error('Command execution error:', executionError);
            status = 'failed';
        }

        // Log command to history
        const command = await storage.createCommandHistory({
            input,
            response: aiResponse.response,
            language: aiResponse.language,
            inputType: req.body.inputType || 'text',
            status,
        });

        // Return combined response
        return res.status(200).json({
            success: true,
            response: aiResponse.response,
            language: aiResponse.language,
            intent: aiResponse.intent,
            result: executionResult,
            command,
        });
    } catch (error) {
        console.error('Command processing error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process command',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
