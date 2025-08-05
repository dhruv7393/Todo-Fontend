import React, { useState } from "react";
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
import { useMock } from "./TaskUtil";
import axios from "axios";

interface Task {
  _id: string;
  taskName: string;
  isDone: boolean;
  carryOutOn: string;
  dateOfCarryOut: string;
  canBeReseted: boolean;
  listOfSubTasks: string[];
}

interface CopyTaskProps {
  open: boolean;
  onClose: () => void;
  onCopyTask: (newTask: Omit<Task, "_id">, parentPath?: string) => void;
  tasks: Task[];
}

const CopyTask = ({ open, onClose, onCopyTask, tasks }: CopyTaskProps) => {
  const [selectedTaskPath, setSelectedTaskPath] = useState<string>("");
  const [parentTaskIndex, setParentTaskIndex] = useState<string>("");
  const [taskName, setTaskName] = useState<string>("");
  const [copySubtasks, setCopySubtasks] = useState<boolean>(false);

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
    if (carryOutOn === "date") {
      return {
        type: "date" as const,
        date: dateOfCarryOut,
        days: [],
        afterDays: 1,
        monthly: 1,
      };
    } else if (carryOutOn.startsWith("monthly")) {
      const monthlyNum = parseInt(carryOutOn.replace("monthly", ""));
      return {
        type: "monthlyDate" as const,
        date: dateOfCarryOut,
        days: [],
        afterDays: 1,
        monthly: monthlyNum,
      };
    } else {
      // Days of week (comma separated)
      const days = carryOutOn.split(", ").filter((day) => day.trim());
      return {
        type: "dayOfWeek" as const,
        date: dateOfCarryOut,
        days: days,
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
      setSelectedDate(parsed.date);
      setSelectedDays(parsed.days);
      setAfterDaysCount(parsed.afterDays);
      setMonthlyDate(parsed.monthly);
      setCanBeReseted(selectedTask.canBeReseted);
    } else {
      setTaskName("");
      setCarryOutType("date");
      setSelectedDate(getTodaysDate());
      setSelectedDays([]);
      setAfterDaysCount(1);
      setMonthlyDate(1);
      setCanBeReseted(false);
    }
  };

  const handleClose = () => {
    setSelectedTaskPath("");
    setParentTaskIndex("");
    setTaskName("");
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

  const handleCopy = () => {
    if (!selectedTaskPath) return;

    // Create a copy of the task with reset properties
    const { carryOutOn, dateOfCarryOut } = getCarryOutValues();

    // Find nestUnder id from parentTaskIndex
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

    let copySubTasksOf = "";
    if (copySubtasks && selectedTaskPath) {
      const selectedTask = getSelectedTask(selectedTaskPath);
      if (selectedTask) {
        copySubTasksOf = selectedTask._id;
      }
    }

    const newTask: Omit<Task, "_id"> & {
      nestUnder: string;
      copySubTasksOf: string;
    } = {
      taskName: taskName,
      isDone: false, // Always start as not done
      carryOutOn,
      dateOfCarryOut,
      canBeReseted,
      listOfSubTasks: [], // Start with no subtasks (will be copied separately if needed)
      nestUnder,
      copySubTasksOf,
    };

    const parentPath =
      parentTaskIndex === "" ? undefined : String(parentTaskIndex);
    onCopyTask(newTask, parentPath);

    // Create copy list for logging

    // Create copy list for logging
    const copyList: (typeof newTask | { copySubTasksOf: string })[] = [newTask];

    if (useMock) {
      console.log("Copy List - Task copied:", copyList);
      console.log("New task:", newTask);
    } else {
      axios
        .post(`${import.meta.env.VITE_APP_BACKEND_URL}`, newTask)
        .then((response) => {
          console.log("Task added successfully:", response.data);
          console.log("Copy List - Task copied:", copyList);
          console.log("New task:", newTask);
        })
        .catch((error) => {
          console.error("Error adding task:", error);
        });
    }

    // Reset form and close
    handleClose();
  };

  const renderTaskHierarchy = (
    taskList: Task[],
    level = 0,
    parentPath: number[] = []
  ): React.ReactElement[] => {
    // Create a task map for quick lookup
    const taskMap = taskList.reduce((map, task) => {
      map[task._id] = task;
      return map;
    }, {} as Record<string, Task>);

    // Get top-level tasks (tasks that are not referenced as subtasks)
    const allSubTaskIds = new Set<string>();
    taskList.forEach((task) => {
      task.listOfSubTasks.forEach((subTaskId) => {
        allSubTaskIds.add(subTaskId);
      });
    });

    const topLevelTasks = taskList.filter(
      (task) => !allSubTaskIds.has(task._id)
    );

    const renderTasksRecursive = (
      currentTasks: Task[],
      currentLevel: number,
      currentPath: number[]
    ): React.ReactElement[] => {
      const elements: React.ReactElement[] = [];

      currentTasks.forEach((task, index) => {
        const taskPath = [...currentPath, index];
        const pathString = taskPath.join("-");

        // Add the current task as a menu item
        elements.push(
          <MenuItem
            key={pathString}
            value={pathString}
            style={{ paddingLeft: currentLevel * 20 + 16 }}
          >
            {"  ".repeat(currentLevel)}→ {task.taskName}
          </MenuItem>
        );

        // Add all subtasks
        if (task.listOfSubTasks.length > 0) {
          const subTasks = task.listOfSubTasks
            .map((id) => taskMap[id])
            .filter(Boolean);

          elements.push(
            ...renderTasksRecursive(subTasks, currentLevel + 1, taskPath)
          );
        }
      });

      return elements;
    };

    return renderTasksRecursive(topLevelTasks, level, parentPath);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Copy Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {/* Task Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Task to Copy</InputLabel>
            <Select
              value={selectedTaskPath}
              onChange={(e) => handleTaskSelection(e.target.value)}
              label="Select Task to Copy"
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

          {/* Copy Subtasks Toggle and Parent Task Selection */}
          {selectedTaskPath && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={copySubtasks}
                    onChange={(e) => setCopySubtasks(e.target.checked)}
                  />
                }
                label="Copy all subtasks"
                sx={{ mb: 2 }}
              />
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
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          disabled={!selectedTaskPath}
        >
          Copy Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CopyTask;
