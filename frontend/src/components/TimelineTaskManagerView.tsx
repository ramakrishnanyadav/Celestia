"use client";

import React, { useState } from "react";
import { 
  Compass, CheckCircle2, Circle, AlertCircle, Clock, Plus, Trash2, 
  Calendar, User, ArrowRight, ShieldCheck, Filter, RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";

interface TimelineTaskManagerViewProps {
  event: any;
  tasks: any[];
  onRefreshData: () => void;
}

export function TimelineTaskManagerView({
  event,
  tasks,
  onRefreshData
}: TimelineTaskManagerViewProps) {
  const [activeMilestoneFilter, setActiveMilestoneFilter] = useState("all");
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Catering");
  const [taskMilestone, setTaskMilestone] = useState("4 Months Out");
  const [taskDurationDays, setTaskDurationDays] = useState(7);
  const [taskPriority, setTaskPriority] = useState("high");
  const [taskAssigned, setTaskAssigned] = useState("Host");

  // Get distinct milestones
  const milestones = ["all", ...Array.from(new Set(tasks.map(t => t.milestone_name)))];

  const filteredTasks = activeMilestoneFilter === "all"
    ? tasks
    : tasks.filter(t => t.milestone_name === activeMilestoneFilter);

  const criticalTasks = tasks.filter(t => t.is_critical);
  const completedTasks = tasks.filter(t => t.status === "completed");

  const handleToggleTaskStatus = async (task: any) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await api.updateTask(event.id, task.id, { status: newStatus });
      onRefreshData();
    } catch (err: any) {
      alert(`Error updating task: ${err.message}`);
    }
  };

  const handleRecalculateCPM = async () => {
    setIsRecalculating(true);
    try {
      await api.recalculateCPM(event.id);
      onRefreshData();
    } catch (err: any) {
      alert(`Error calculating CPM: ${err.message}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(event.id, taskId);
      onRefreshData();
    } catch (err: any) {
      alert(`Error deleting task: ${err.message}`);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      await api.createTask(event.id, {
        title: taskTitle,
        category: taskCategory,
        milestone_name: taskMilestone,
        duration_days: Number(taskDurationDays),
        priority: taskPriority,
        assigned_to: taskAssigned,
        days_before_event: 90
      });
      setShowAddTaskModal(false);
      setTaskTitle("");
      onRefreshData();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CPM Critical Path Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1C2541] via-[#0A1128] to-[#1C2541] border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Critical Path Method (CPM) Schedule Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                DAG Algorithm Active
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              Identified <strong>{criticalTasks.length} critical path tasks</strong> with 0 days of slack. 
              Any delay in these tasks will directly delay the final event date.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleRecalculateCPM}
            disabled={isRecalculating}
            className="px-3.5 py-2 rounded-xl bg-[#0B132B] hover:bg-[#243054] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate CPM</span>
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-teal-950/40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Milestone Tabs & Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Milestones:</span>
        </span>
        {milestones.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMilestoneFilter(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeMilestoneFilter === m
                ? "bg-teal-600 text-white shadow-md shadow-teal-950/40"
                : "bg-[#1C2541] text-slate-300 hover:text-white hover:bg-[#243054]"
            }`}
          >
            {m === "all" ? "All Milestones" : m}
          </button>
        ))}
      </div>

      {/* Task Checklist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTasks.map((t) => {
          const isDone = t.status === "completed";
          return (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isDone
                  ? "bg-[#0B132B]/40 border-white/5 opacity-70"
                  : t.is_critical
                  ? "bg-[#1C2541]/90 border-amber-500/40 shadow-lg shadow-amber-950/10"
                  : "bg-[#1C2541]/70 border-white/10 hover:border-teal-500/30"
              }`}
            >
              <div>
                {/* Card Top Metadata */}
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-medium">
                      {t.milestone_name}
                    </span>
                    <span className="text-slate-400">• {t.category}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {t.is_critical && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        Critical Path
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                      t.priority === 'critical' ? 'bg-rose-950 text-rose-300' :
                      t.priority === 'high' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                </div>

                {/* Task Title & Status Toggle */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTaskStatus(t)}
                    className="mt-0.5 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4 className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: CPM Slack & Assignments */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-2.5 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-300">{t.assigned_to || "Host"}</span>
                  </span>
                  <span>•</span>
                  <span>Duration: {t.duration_days}d</span>
                  <span>•</span>
                  <span className={t.total_slack === 0 ? "text-amber-400 font-semibold" : "text-slate-400"}>
                    Slack: {t.total_slack}d
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTask(t.id)}
                  title="Delete task"
                  className="p-1 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C2541] border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Custom Task</h3>
            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Confirm Shehnai Troupe Arrival Timings"
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Decor">Decor</option>
                    <option value="Ceremony">Ceremony</option>
                    <option value="Attire">Attire</option>
                    <option value="Photography">Photography</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Milestone Anchor</label>
                  <select
                    value={taskMilestone}
                    onChange={(e) => setTaskMilestone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  >
                    <option value="6 Months Out">6 Months Out</option>
                    <option value="4 Months Out">4 Months Out</option>
                    <option value="3 Months Out">3 Months Out</option>
                    <option value="2 Months Out">2 Months Out</option>
                    <option value="1 Month Out">1 Month Out</option>
                    <option value="2 Weeks Out">2 Weeks Out</option>
                    <option value="Wedding Day">Wedding Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={taskDurationDays}
                    onChange={(e) => setTaskDurationDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={taskAssigned}
                    onChange={(e) => setTaskAssigned(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B132B] hover:bg-[#243054] text-xs text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs text-white font-semibold transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
