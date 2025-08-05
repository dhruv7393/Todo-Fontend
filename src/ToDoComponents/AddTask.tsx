import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  Typography,
  Slider,
} from "@mui/material";
import type { Task } from "./TaskTypes";
import { endpoint, renderTaskHierarchy, useMock } from "./TaskUtil";
import axios from "axios";

interface AddTaskProps {
  open: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "_id">, parentPath?: string) => void;
  tasks: Task[];
}

const AddTask = ({ open, onClose, onAddTask, tasks }: AddTaskProps) => {
  const getTodaysDate = () => {
    const today = new Date();
    const estDate = new Date(
      today.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    return estDate.toISOString().split("T")[0];
  };

  const [taskName, setTaskName] = useState("");
  const [canBeReseted, setCanBeReseted] = useState(false);
  const [parentTaskIndex, setParentTaskIndex] = useState<string>("");

  // Carry out options
  const [carryOutType, setCarryOutType] = useState<
    "date" | "dayOfWeek" | "afterDays" | "monthlyDate"
  >("date");
  const [selectedDate, setSelectedDate] = useState(getTodaysDate());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [afterDaysCount, setAfterDaysCount] = useState(1);
  const [monthlyDate, setMonthlyDate] = useState(1);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

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
          carryOutOn: getTodaysDate(),
          dateOfCarryOut: getTodaysDate(),
        };
    }
  };

  const handleAdd = () => {
    if (!taskName.trim()) return;

    const { carryOutOn, dateOfCarryOut } = getCarryOutValues();

    // Find parent task id from parentTaskIndex path
    let nestUnder: string | undefined = undefined;
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

    const newTask: Omit<Task, "_id"> & { nestUnder?: string } = {
      taskName: taskName.trim(),
      isDone: false,
      carryOutOn,
      dateOfCarryOut,
      canBeReseted,
      listOfSubTasks: [],
      ...(nestUnder ? { nestUnder } : {}),
    };

    const parentPath =
      parentTaskIndex === "" ? undefined : String(parentTaskIndex);

    const resetForm = () => {
      setTaskName("");
      setCanBeReseted(false);
      setParentTaskIndex("");
      setCarryOutType("date");
      setSelectedDate(getTodaysDate());
      setSelectedDays([]);
      setAfterDaysCount(1);
      setMonthlyDate(1);
      onClose();
    };

    if (useMock) {
      onAddTask(newTask, parentPath);
      console.log("New Task Added:", newTask);
      resetForm();
    } else {
      axios
        .post(`${endpoint}`, newTask)
        .then((response) => {
          console.log("Task added successfully:", response.data);
          onAddTask(newTask, parentPath);
          resetForm();
        })
        .catch((error) => {
          console.error("Error adding task:", error);
        });
    }
  };

  const handleClose = () => {
    // Reset form on close
    setTaskName("");
    setCanBeReseted(false);
    setParentTaskIndex("");
    setCarryOutType("date");
    setSelectedDate(getTodaysDate());
    setSelectedDays([]);
    setAfterDaysCount(1);
    setMonthlyDate(1);
    onClose();
  };

  // ...existing code...

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Task</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Task Name"
          fullWidth
          variant="outlined"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
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

        {carryOutType === "date" && (
          <TextField
            margin="dense"
            label="Select Date"
            type="date"
            fullWidth
            variant="outlined"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        )}

        {carryOutType === "dayOfWeek" && (
          <Box sx={{ mb: 2 }}>
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

        {carryOutType === "afterDays" && (
          <Box sx={{ mb: 2 }}>
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

        {carryOutType === "monthlyDate" && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              m{monthlyDate} (day {monthlyDate} of every month)
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

        <FormControlLabel
          control={
            <Switch
              checked={canBeReseted}
              onChange={(e) => setCanBeReseted(e.target.checked)}
            />
          }
          label="Can be reset"
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Add as subtask under (optional)</InputLabel>
          <Select
            value={parentTaskIndex}
            onChange={(e) => {
              const value = e.target.value;
              setParentTaskIndex(value);
            }}
            label="Add as subtask under (optional)"
          >
            <MenuItem value="">
              <em>None (Top level task)</em>
            </MenuItem>
            {renderTaskHierarchy(tasks)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={!taskName.trim()}
        >
          Add Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTask;
