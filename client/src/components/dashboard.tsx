import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DashboardProps {
  data: any;
  currentDate: string;
  language: "en" | "ur" | "roman-ur";
}

export default function Dashboard({ data, currentDate, language }: DashboardProps) {
  const { data: commandHistory } = useQuery({
    queryKey: ['/api/commands/history'],
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['/api/calendar/today'],
  });

  const { data: recentEmails } = useQuery({
    queryKey: ['/api/emails/unread'],
  });

  const { data: pendingTasks } = useQuery({
    queryKey: ['/api/tasks/pending'],
  });

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <Card data-testid="todays-overview-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Today's Overview</h2>
            <span className="text-sm text-muted-foreground" data-testid="current-date">
              {currentDate}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Meetings Today</p>
                  <p className="text-2xl font-bold text-blue-700" data-testid="meetings-count">
                    {data?.todayMeetings || 0}
                  </p>
                </div>
                <i className="fas fa-calendar-day text-blue-500 text-xl"></i>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Unread Emails</p>
                  <p className="text-2xl font-bold text-orange-700" data-testid="emails-count">
                    {data?.unreadEmails || 0}
                  </p>
                </div>
                <i className="fas fa-envelope text-orange-500 text-xl"></i>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Pending Tasks</p>
                  <p className="text-2xl font-bold text-green-700" data-testid="tasks-count">
                    {data?.pendingTasks || 0}
                  </p>
                </div>
                <i className="fas fa-tasks text-green-500 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Next Meeting */}
          {data?.nextMeeting && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Next Meeting</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" data-testid="next-meeting-title">
                    {data.nextMeeting.title}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="next-meeting-time">
                    {data.nextMeeting.time}
                  </p>
                </div>
                <Button 
                  size="sm"
                  data-testid="button-join-meeting"
                >
                  Join Now
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Calendar Widget */}
        <Card data-testid="calendar-widget">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-calendar text-blue-500 mr-2"></i>
                Calendar
              </h3>
              <Button variant="link" size="sm" data-testid="button-view-all-calendar">
                View All
              </Button>
            </div>
            
            {/* Upcoming Events */}
            <div className="space-y-3">
              {upcomingEvents?.slice(0, 5).map((event: any, index: number) => (
                <div 
                  key={event.id} 
                  className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  data-testid={`event-item-${index}`}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>
              ))}
              {(!upcomingEvents || upcomingEvents.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No upcoming events
                </p>
              )}
            </div>

            <Button 
              variant="secondary" 
              className="w-full mt-4"
              data-testid="button-schedule-new"
            >
              + Schedule New Meeting
            </Button>
          </CardContent>
        </Card>

        {/* Email Widget */}
        <Card data-testid="email-widget">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-envelope text-orange-500 mr-2"></i>
                Recent Emails
              </h3>
              <Button variant="link" size="sm" data-testid="button-view-all-emails">
                View All
              </Button>
            </div>
            
            {/* Email List */}
            <div className="space-y-3">
              {recentEmails?.slice(0, 5).map((email: any, index: number) => (
                <div 
                  key={email.id}
                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                  data-testid={`email-item-${index}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm truncate">{email.sender}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(email.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">{email.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {email.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
              {(!recentEmails || recentEmails.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No unread emails
                </p>
              )}
            </div>

            <Button 
              variant="secondary" 
              className="w-full mt-4"
              data-testid="button-compose-email"
            >
              + Compose Email
            </Button>
          </CardContent>
        </Card>

        {/* Tasks Widget */}
        <Card data-testid="tasks-widget">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-tasks text-purple-500 mr-2"></i>
                Tasks & Notes
              </h3>
              <Button variant="link" size="sm" data-testid="button-view-all-tasks">
                View All
              </Button>
            </div>
            
            {/* Task List */}
            <div className="space-y-3">
              {pendingTasks?.slice(0, 5).map((task: any, index: number) => (
                <div 
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  data-testid={`task-item-${index}`}
                >
                  <Checkbox 
                    checked={task.completed}
                    data-testid={`task-checkbox-${index}`}
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(task.dueDate), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.completed ? 'Done' : task.priority}
                  </Badge>
                </div>
              ))}
              {(!pendingTasks || pendingTasks.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No pending tasks
                </p>
              )}
            </div>

            <Button 
              variant="secondary" 
              className="w-full mt-4"
              data-testid="button-add-task"
            >
              + Add New Task
            </Button>
          </CardContent>
        </Card>

        {/* Command History Widget */}
        <Card data-testid="command-history-widget">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-history text-gray-500 mr-2"></i>
                Command History
              </h3>
              <Button variant="link" size="sm" data-testid="button-clear-history">
                Clear
              </Button>
            </div>
            
            {/* Command List */}
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {commandHistory?.slice(0, 10).map((command: any, index: number) => (
                <div 
                  key={command.id}
                  className="p-3 bg-muted rounded-lg"
                  data-testid={`command-item-${index}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(command.createdAt), 'h:mm a')}
                    </p>
                    <Badge className={getStatusColor(command.status)}>
                      {command.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    "{command.input}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ✓ {command.response}
                  </p>
                </div>
              ))}
              {(!commandHistory || commandHistory.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No command history
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
