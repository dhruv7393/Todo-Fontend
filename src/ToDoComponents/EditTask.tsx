import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
  Typography,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import type { Task } from "./TaskTypes";
import { renderTaskHierarchy, useMock } from "./TaskUtil";
import axios from "axios";

// (Task type imported from TaskTypes)

interface EditTaskProps {
  open: boolean;
  onClose: () => void;
  onEditTask: (editedTask: Task, parentPath?: string) => void;
  tasks: Task[];
}

const EditTask = ({ open, onClose, onEditTask, tasks }: EditTaskProps) => {
  const [selectedTaskPath, setSelectedTaskPath] = useState<string>("");
  const [taskName, setTaskName] = useState<string>("");
  const [parentTaskIndex, setParentTaskIndex] = useState<string>("");

  // Carry out options
  const [carryOutType, setCarryOutType] = useState<
    "date" | "dayOfWeek" | "afterDays" | "monthlyDate"
  >("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [afterDaysCount, setAfterDaysCount] = useState(1);
  const [monthlyDate, setMonthlyDate] = useState(1);
  const [canBeReseted, setCanBeReseted] = useState(false);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getTodaysDate = () => {
    const today = new Date();
    const estDate = new Date(
      today.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    return estDate.toISOString().split("T")[0];
  };

  const parseCarryOutOn = (carryOutOn: string, dateOfCarryOut: string) => {
    if (carryOutOn.startsWith("monthly")) {
      const monthlyNum = parseInt(carryOutOn.replace("monthly", ""));
      return {
        type: "monthlyDate" as const,
        date: dateOfCarryOut,
        days: [],
        afterDays: 1,
        monthly: monthlyNum,
      };
    } else if (daysOfWeek.some((day) => carryOutOn.includes(day))) {
      // Days of week (comma separated)
      const days = carryOutOn.split(", ").filter((day) => day.trim());
      return {
        type: "dayOfWeek" as const,
        date: dateOfCarryOut,
        days: days,
        afterDays: 1,
        monthly: 1,
      };
    } else {
      return {
        type: "date" as const,
        date: dateOfCarryOut,
        days: [],
        afterDays: 1,
        monthly: 1,
      };
    }
  };

  const getSelectedTask = (path: string) => {
    if (!path) return null;

    const pathIndices = path.split("-").map(Number);
    const taskMap = tasks.reduce((map, task) => {
      map[task._id] = task;
      return map;
    }, {} as Record<string, Task>);

    // Get top-level tasks (same logic as renderTaskHierarchy)
    const allSubTaskIds = new Set<string>();
    tasks.forEach((task) => {
      task.listOfSubTasks.forEach((subTaskId) => {
        allSubTaskIds.add(subTaskId);
      });
    });

    const topLevelTasks = tasks.filter((task) => !allSubTaskIds.has(task._id));

    let selectedTask = topLevelTasks[pathIndices[0]];
    if (!selectedTask) return null;

    for (let i = 1; i < pathIndices.length; i++) {
      const subTasks = selectedTask.listOfSubTasks
        .map((id) => taskMap[id])
        .filter(Boolean);

      if (pathIndices[i] >= subTasks.length) return null;
      selectedTask = subTasks[pathIndices[i]];
      if (!selectedTask) return null;
    }

    return selectedTask;
  };

  const handleTaskSelection = (path: string) => {
    setSelectedTaskPath(path);
    const selectedTask = getSelectedTask(path);
    if (selectedTask) {
      setTaskName(selectedTask.taskName);

      // Parse and populate carry out options
      const parsed = parseCarryOutOn(
        selectedTask.carryOutOn,
        selectedTask.dateOfCarryOut
      );
      setCarryOutType(parsed.type);
      // If carryOutOn is 'date', use dateOfCarryOut as default value for Select Date
      if (parsed.type === "date") {
        setSelectedDate(parsed.date);
      }
      setSelectedDays(parsed.days);
      setAfterDaysCount(parsed.afterDays);
      setMonthlyDate(parsed.monthly);
      setCanBeReseted(selectedTask.canBeReseted);

      // Set default parent task if this is a nested task
      const pathIndices = path.split("-").map(Number);
      if (pathIndices.length > 1) {
        // This is a nested task, set parent as default
        const parentPath = pathIndices.slice(0, -1).join("-");
        setParentTaskIndex(parentPath);
      } else {
        // This is a top-level task, no parent
        setParentTaskIndex("");
      }
    } else {
      setTaskName("");
      setCarryOutType("date");
      setSelectedDate(getTodaysDate());
      setSelectedDays([]);
      setAfterDaysCount(1);
      setMonthlyDate(1);
      setCanBeReseted(false);
      setParentTaskIndex("");
    }
  };

  const handleClose = () => {
    setSelectedTaskPath("");
    setTaskName("");
    setParentTaskIndex("");
    setCarryOutType("date");
    setSelectedDate(getTodaysDate());
    setSelectedDays([]);
    setAfterDaysCount(1);
    setMonthlyDate(1);
    setCanBeReseted(false);
    onClose();
  };

  const getCarryOutValues = () => {
    switch (carryOutType) {
      case "date":
        return {
          carryOutOn: "date",
          dateOfCarryOut: selectedDate || getTodaysDate(),
        };
      case "dayOfWeek":
        return {
          carryOutOn: selectedDays.join(", "),
          dateOfCarryOut: getNextDateForDays(selectedDays),
        };
      case "afterDays":
        return {
          carryOutOn: "date",
          dateOfCarryOut: getDateAfterDays(afterDaysCount),
        };
      case "monthlyDate":
        return {
          carryOutOn: `monthly${monthlyDate}`,
          dateOfCarryOut: getMonthlyDate(monthlyDate),
        };
      default:
        return {
          carryOutOn: "date",
          dateOfCarryOut: getTodaysDate(),
        };
    }
  };

  const getNextDateForDays = (daysArray: string[]): string => {
    if (daysArray.length === 0) return getTodaysDate();

    const today = new Date();
    const estToday = new Date(
      today.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayIndex = estToday.getDay();

    // Find the next occurrence of any selected day
    for (let i = 0; i <= 7; i++) {
      const checkIndex = (todayIndex + i) % 7;
      const dayName = dayNames[checkIndex];
      if (daysArray.includes(dayName)) {
        const nextDate = new Date(estToday);
        nextDate.setDate(estToday.getDate() + i);
        return nextDate.toISOString().split("T")[0];
      }
    }
    return getTodaysDate();
  };

  const getDateAfterDays = (days: number): string => {
    const today = new Date();
    const estToday = new Date(
      today.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    estToday.setDate(estToday.getDate() + days);
    return estToday.toISOString().split("T")[0];
  };

  const getMonthlyDate = (date: number): string => {
    const today = new Date();
    const estToday = new Date(
      today.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const year = estToday.getFullYear();
    const month = estToday.getMonth();

    // Try current month first
    const currentMonthDate = new Date(year, month, date);
    if (currentMonthDate >= estToday) {
      return currentMonthDate.toISOString().split("T")[0];
    }

    // If past, use next month
    const nextMonthDate = new Date(year, month + 1, date);
    return nextMonthDate.toISOString().split("T")[0];
  };

  const handleEdit = () => {
    if (!selectedTaskPath) return;

    // Get the selected task to preserve its ID and other properties
    const selectedTask = getSelectedTask(selectedTaskPath);
    if (!selectedTask) return;

    // Find current parent id
    let currentParent = "";
    for (const task of tasks) {
      if (task.listOfSubTasks.includes(selectedTask._id)) {
        currentParent = task._id;
        break;
      }
    }

    // Find new parent id (nestUnder) from parentTaskIndex
    let nestUnder = "";
    if (parentTaskIndex !== "") {
      const pathIndices = parentTaskIndex.split("-").map(Number);
      let currentTasks = tasks;
      let parentTask: Task | undefined;
      for (let i = 0; i < pathIndices.length; i++) {
        const idx = pathIndices[i];
        parentTask = currentTasks[idx];
        if (!parentTask) break;
        if (i < pathIndices.length - 1) {
          currentTasks = parentTask.listOfSubTasks
            .map((id) => tasks.find((t) => t._id === id))
            .filter(Boolean) as Task[];
        }
      }
      if (parentTask) nestUnder = parentTask._id;
    }

    // Create an edited task with the same ID but updated properties
    const { carryOutOn, dateOfCarryOut } = getCarryOutValues();

    const editedTask: Task & { currentParent: string; nestUnder: string } = {
      _id: selectedTask._id, // Keep the same ID
      taskName: taskName,
      isDone: selectedTask.isDone, // Preserve completion status
      carryOutOn,
      dateOfCarryOut,
      canBeReseted,
      listOfSubTasks: selectedTask.listOfSubTasks, // Preserve subtasks
      currentParent,
      nestUnder,
    };

    const parentPath =
      parentTaskIndex === "" ? undefined : String(parentTaskIndex);

    // Track parent task changes for EditedList
    const editedParentTasks: Task[] = [];

    if (parentPath !== undefined) {
      // Find current parents (tasks that contain this task as subtask)
      const currentParents = tasks.filter((task) =>
        task.listOfSubTasks.includes(selectedTask._id)
      );

      // Remove from current parents
      currentParents.forEach((parent) => {
        const updatedParent = {
          ...parent,
          listOfSubTasks: parent.listOfSubTasks.filter(
            (id) => id !== selectedTask._id
          ),
        };
        editedParentTasks.push(updatedParent);
      });

      // Add to new parent if specified
      if (parentPath !== "") {
        const newParentTask = getSelectedTask(parentPath);
        if (newParentTask) {
          const existingIndex = editedParentTasks.findIndex(
            (t) => t._id === newParentTask._id
          );
          if (existingIndex >= 0) {
            // Update existing entry
            editedParentTasks[existingIndex] = {
              ...editedParentTasks[existingIndex],
              listOfSubTasks: [
                ...editedParentTasks[existingIndex].listOfSubTasks,
                selectedTask._id,
              ],
            };
          } else {
            // Add new entry
            const updatedNewParent = {
              ...newParentTask,
              listOfSubTasks: [
                ...newParentTask.listOfSubTasks,
                selectedTask._id,
              ],
            };
            editedParentTasks.push(updatedNewParent);
          }
        }
      }
    }

    if (useMock) {
      console.log("Edit - Task to be edited:", editedTask);
      onEditTask(editedTask, parentPath);
    } else {
      axios
        .patch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/${editedTask._id}`,
          editedTask
        )
        .then((response) => {
          console.log("Edit - Task updated:", response.data);
          onEditTask(editedTask, parentPath);
        })
        .catch((error) => {
          console.error("Error updating task:", error);
        });
    }

    // Reset form and close
    handleClose();
  };

  // ...existing code...

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {/* Task Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Task to Edit</InputLabel>
            <Select
              value={selectedTaskPath}
              onChange={(e) => handleTaskSelection(e.target.value)}
              label="Select Task to Edit"
            >
              {renderTaskHierarchy(tasks)}
            </Select>
          </FormControl>

          {/* Task Name Input */}
          {selectedTaskPath && (
            <TextField
              fullWidth
              label="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              variant="outlined"
            />
          )}

          {/* Carry Out On Options */}
          {selectedTaskPath && (
            <FormControl fullWidth>
              <InputLabel>Carry Out On</InputLabel>
              <Select
                value={carryOutType}
                onChange={(e) =>
                  setCarryOutType(
                    e.target.value as
                      | "date"
                      | "dayOfWeek"
                      | "afterDays"
                      | "monthlyDate"
                  )
                }
                label="Carry Out On"
              >
                <MenuItem value="date">Specific Date</MenuItem>
                <MenuItem value="dayOfWeek">Day(s) of Week</MenuItem>
                <MenuItem value="afterDays">After Certain Days</MenuItem>
                <MenuItem value="monthlyDate">Monthly Date</MenuItem>
              </Select>
            </FormControl>
          )}

          {selectedTaskPath && carryOutType === "date" && (
            <TextField
              label="Select Date"
              type="date"
              fullWidth
              variant="outlined"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}

          {selectedTaskPath && carryOutType === "dayOfWeek" && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Days of Week:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {daysOfWeek.map((day) => (
                  <Chip
                    key={day}
                    label={day}
                    clickable
                    color={selectedDays.includes(day) ? "primary" : "default"}
                    onClick={() => {
                      setSelectedDays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day]
                      );
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {selectedTaskPath && carryOutType === "afterDays" && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                After {afterDaysCount} day(s)
              </Typography>
              <Slider
                value={afterDaysCount}
                onChange={(_, value) => setAfterDaysCount(value as number)}
                min={0}
                max={365}
                step={1}
                marks={[
                  { value: 0, label: "0" },
                  { value: 30, label: "30" },
                  { value: 90, label: "90" },
                  { value: 180, label: "180" },
                  { value: 365, label: "365" },
                ]}
              />
            </Box>
          )}

          {selectedTaskPath && carryOutType === "monthlyDate" && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                monthly{monthlyDate} (day {monthlyDate} of every month)
              </Typography>
              <Slider
                value={monthlyDate}
                onChange={(_, value) => setMonthlyDate(value as number)}
                min={1}
                max={28}
                step={1}
                marks={[
                  { value: 1, label: "1st" },
                  { value: 7, label: "7th" },
                  { value: 14, label: "14th" },
                  { value: 21, label: "21st" },
                  { value: 28, label: "28th" },
                ]}
              />
            </Box>
          )}

          {/* Can Be Reset Toggle */}
          {selectedTaskPath && (
            <FormControlLabel
              control={
                <Switch
                  checked={canBeReseted}
                  onChange={(e) => setCanBeReseted(e.target.checked)}
                />
              }
              label="Can be reset"
            />
          )}

          {/* Parent Task Selection */}
          {selectedTaskPath && (
            <FormControl fullWidth>
              <InputLabel>Add as Subtask Under (Optional)</InputLabel>
              <Select
                value={parentTaskIndex}
                onChange={(e) => setParentTaskIndex(e.target.value)}
                label="Add as Subtask Under (Optional)"
              >
                <MenuItem value="">
                  <em>None (Top-level task)</em>
                </MenuItem>
                {renderTaskHierarchy(tasks)}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleEdit}
          variant="contained"
          disabled={!selectedTaskPath}
        >
          Update Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTask;
