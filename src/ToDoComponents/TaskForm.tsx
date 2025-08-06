import React, { useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Task } from "./TaskTypes";
import { RichTreeView, TreeViewBaseItem } from "@mui/x-tree-view";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Slider,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import axios from "axios";
import { endpoint } from "./TaskUtil";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  operation?: "Add" | "Delete" | "Update" | "Copy";
}

interface currentTaskType {
  _id?: string;
  taskName: string;
  isDone: boolean;
  carryOutOn: string;
  dateOfCarryOut: string;
  canBeReseted: boolean;
  listOfSubTasks: string[];
  currentParent: string;
  nestUnder: string;
  copySubTasks?: boolean;
  copySubTasksOf: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onClose,
  tasks,
  operation = "Add",
}) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so add 1
  const day = String(date.getDate()).padStart(2, "0");

  const emptyTask: currentTaskType = {
    taskName: "",
    isDone: false,
    carryOutOn: "date",
    dateOfCarryOut: `${year}-${month}-${day}`,
    canBeReseted: false,
    listOfSubTasks: [],
    currentParent: "",
    nestUnder: "",
    copySubTasks: false,
    copySubTasksOf: "",
  };
  const [currentTask, setCurrentTask] = React.useState<currentTaskType>({
    ...emptyTask,
  });
  const [displayForm, setDisplayForm] = React.useState(operation === "Add");
  const [selectedItem, setSelectedItem] = React.useState<
    | (Task & {
        currentParent: string;
        nestUnder: string;
        copySubTasksOf: string;
      })
    | null
  >(null);

  console.log("Current Task:", currentTask);

  useEffect(() => {
    if (!open) {
      setCurrentTask({ ...emptyTask });
      setDisplayForm(operation === "Add");
      setSelectedItem(null);
    }
  }, [open, operation]);

  const makeRequest = () => {
    const { _id = "", copySubTasks, currentParent, ...newTask } = currentTask;
    if (operation === "Add" || operation === "Copy") {
      axios
        .post(`${endpoint}`, {
          ...newTask,
          copySubTasksOf:
            operation === "Copy" && copySubTasks
              ? currentTask.copySubTasksOf
              : "",
        })
        .then(() => {
          onClose();
        })
        .catch((error) => {
          console.error("Error adding task:", error);
        });
    } else if (operation === "Delete") {
      axios
        .delete(`${endpoint}/${_id}`)
        .then(() => {
          onClose();
        })
        .catch((error) => {
          console.error("Error deleting task:", error);
        });
    } else if (operation === "Update") {
      axios
        .patch(`${endpoint}/${_id}`, {
          ...newTask,
          _id: _id,
          currentParent: currentParent,
        })
        .then(() => {
          onClose();
        })
        .catch((error) => {
          console.error("Error updating task:", error);
        });
    }
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Helper to find node and parent by id
  const findNodeAndParent = (
    items: TreeViewBaseItem[],
    targetId: string,
    parentId: string = ""
  ):
    | (Task & {
        currentParent: string;
        nestUnder: string;
        copySubTasksOf: string;
      })
    | null => {
    for (const item of items) {
      if (item.id === targetId) {
        // Find the full task object by id
        const taskObj = tasks.find((t) => t._id === targetId);
        if (taskObj) {
          return {
            ...taskObj,
            currentParent: parentId,
            nestUnder: parentId,
            copySubTasksOf: targetId,
          };
        }
      }
      if (item.children) {
        const found = findNodeAndParent(
          item.children as TreeViewBaseItem[],
          targetId,
          item.id as string
        );
        if (found) return found;
      }
    }
    return null;
  };

  const handleSelectedItemsChange = (
    _: React.SyntheticEvent | unknown,
    itemIds: string | null
  ) => {
    const currentItem = itemIds ? itemIds.toString() : "";
    if (currentItem) {
      const tree = generateTreeOfTasks(tasks);
      const found = findNodeAndParent(tree, currentItem);
      setSelectedItem(found);
    } else {
      setSelectedItem(null);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{operation} Task</DialogTitle>
      <DialogContent>
        {(!displayForm && (
          <RichTreeView
            items={generateTreeOfTasks(tasks)}
            onSelectedItemsChange={handleSelectedItemsChange}
          />
        )) || (
          <>
            <TextField
              autoFocus
              margin="dense"
              label="Task Name"
              fullWidth
              variant="outlined"
              value={currentTask.taskName}
              onChange={(e) =>
                setCurrentTask({ ...currentTask, taskName: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Carry Out On</InputLabel>
              <Select
                value={
                  currentTask.carryOutOn === "date"
                    ? "date"
                    : currentTask.carryOutOn.includes("monthly")
                    ? "monthlyDate"
                    : "dayOfWeek"
                }
                onChange={(e) => {
                  const typeOfcarryOutOn = ["date"].includes(e.target.value)
                    ? "date"
                    : e.target.value.includes("monthly")
                    ? "monthly1"
                    : "Monday";

                  console.log("I am here");

                  const dateOfCarryOut =
                    typeOfcarryOutOn === "date"
                      ? `${year}-${month}-${day}`
                      : typeOfcarryOutOn === "monthly1"
                      ? getUpcomingDateInMonthYear(Number(month), year)
                      : getNextDateForDaysOfWeek("Monday");

                  setCurrentTask({
                    ...currentTask,
                    carryOutOn: typeOfcarryOutOn,
                    dateOfCarryOut: dateOfCarryOut as string,
                  });
                }}
                label="Carry Out On"
              >
                <MenuItem value="date">Specific Date</MenuItem>
                <MenuItem value="dayOfWeek">Day(s) of Week</MenuItem>
                <MenuItem value="monthlyDate">Monthly Date</MenuItem>
              </Select>
            </FormControl>
            {currentTask.carryOutOn === "date" && (
              <TextField
                margin="dense"
                label="Select Date"
                type="date"
                fullWidth
                variant="outlined"
                value={currentTask.dateOfCarryOut}
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    dateOfCarryOut: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            )}
            {currentTask.carryOutOn.includes("monthly") && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {currentTask.carryOutOn.replace("monthly", "")}
                  {getOrdinalSuffix(
                    Number(currentTask.carryOutOn.replace("monthly", ""))
                  )}{" "}
                  of every month
                </Typography>
                <Slider
                  value={
                    Number(currentTask.carryOutOn.replace("monthly", "")) || 1
                  }
                  onChange={(_, value) => {
                    setCurrentTask((prev) => ({
                      ...prev,
                      carryOutOn: `monthly${value}`,
                      dateOfCarryOut: getUpcomingDateInMonthYear(
                        Number(month),
                        year,
                        Number(value)
                      ) as string,
                    }));
                  }}
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
            {currentTask.carryOutOn !== "date" &&
              !currentTask.carryOutOn.includes("monthly") && (
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
                        color={
                          currentTask.carryOutOn.includes(day)
                            ? "primary"
                            : "default"
                        }
                        onClick={() => {
                          setCurrentTask((prev) => {
                            const newDays = prev.carryOutOn.includes(day)
                              ? prev.carryOutOn.replace(day, "")
                              : `${prev.carryOutOn},${day}`;
                            return {
                              ...prev,
                              carryOutOn: newDays,
                              dateOfCarryOut: getNextDateForDaysOfWeek(newDays),
                            };
                          });
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            <FormControlLabel
              control={
                <Switch
                  checked={currentTask.canBeReseted}
                  onChange={(e) =>
                    setCurrentTask({
                      ...currentTask,
                      canBeReseted: e.target.checked,
                    })
                  }
                />
              }
              label="Can be reset"
              sx={{ mb: 2 }}
            />
            {(operation === "Copy" && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentTask.copySubTasks || false}
                      onChange={(e) =>
                        setCurrentTask({
                          ...currentTask,
                          copySubTasks: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Copy Subtasks"
                  sx={{ mb: 2 }}
                />
              </>
            )) || <></>}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Add as subtask to:
            </Typography>
            <RichTreeView
              items={[
                {
                  id: "none",
                  label: "None",
                },
                ...generateTreeOfTasks(tasks),
              ]}
              selectedItems={
                currentTask.nestUnder ? currentTask.nestUnder : "none"
              }
              onSelectedItemsChange={(_, itemId) => {
                const id = itemId ? itemId.toString() : "none";
                setCurrentTask({
                  ...currentTask,
                  nestUnder: id === "none" ? "" : id,
                });
              }}
              defaultExpandedItems={["none", ...tasks.map((task) => task._id)]}
              sx={{ mb: 2 }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {(!displayForm && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setCurrentTask({
                ...currentTask,
                ...(selectedItem as currentTaskType),
              });
              setDisplayForm(true);
            }}
            disabled={!selectedItem}
          >
            Select
          </Button>
        )) || <></>}
        {(displayForm && (
          <Button variant="contained" color="primary" onClick={makeRequest}>
            Save
          </Button>
        )) || <></>}
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm;

const getTopLevelTaskIds = (tasks: Task[]): string[] => {
  const listOfSSubtasks = tasks.flatMap((task) => task.listOfSubTasks);
  const topLevelTasks = tasks.filter(
    (task) => !listOfSSubtasks.includes(task._id)
  );
  return topLevelTasks.flatMap((task) => task._id);
};

const generateTreeOfTasks = (tasks: Task[]) => {
  // Create a map for quick lookup
  const taskMap = tasks.reduce((map, task) => {
    map[task._id] = task;
    return map;
  }, {} as Record<string, Task>);

  // Recursive function to build children for a given task id

  const buildChildren = (taskId: string): TreeViewBaseItem[] => {
    const task = taskMap[taskId];
    if (!task) return [];
    return task.listOfSubTasks.map((subId) => {
      const subChildren = buildChildren(subId);
      const base = {
        id: subId,
        label: taskMap[subId]?.taskName || "",
      };
      if (subChildren.length > 0) {
        return {
          ...base,
          children: subChildren,
        };
      } else {
        return base;
      }
    });
  };

  // Build the tree array from top-level tasks
  return getTopLevelTaskIds(tasks).map((topId) => {
    const topTask = taskMap[topId];
    const children = buildChildren(topId);
    const base = {
      id: topId,
      label: topTask?.taskName || "",
    };
    if (children.length > 0) {
      return {
        ...base,
        children,
      };
    } else {
      return base;
    }
  });
};

/**
 * Returns the next available date (YYYY-MM-DD) in the given month and year that is >= today.
 * If today is in the same month/year, returns today or the next day in the month.
 * If today is after the last day of the month, returns null.
 */
function getUpcomingDateInMonthYear(
  month: number,
  year: number,
  date: number = 1
): string | null {
  const today = new Date();
  let targetYear = year;
  let targetMonth = month - 1; // JS Date months are 0-indexed

  // Clamp date to valid range for the month
  let lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  let targetDate = Math.max(1, Math.min(date, lastDay));

  let target = new Date(targetYear, targetMonth, targetDate);

  // If target date is before today, move to next month
  if (
    target.getFullYear() < today.getFullYear() ||
    (target.getFullYear() === today.getFullYear() &&
      (target.getMonth() < today.getMonth() ||
        (target.getMonth() === today.getMonth() &&
          target.getDate() < today.getDate())))
  ) {
    // Move to next month
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    targetDate = Math.max(1, Math.min(date, lastDay));
    target = new Date(targetYear, targetMonth, targetDate);
  }

  // Return the target date in YYYY-MM-DD format
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(target.getDate()).padStart(2, "0")}`;
}

/**
 * Returns the next date (YYYY-MM-DD) for the earliest approaching day in daysOfWeek (comma-separated, e.g., "Monday,Tuesday") that is >= today.
 * @param daysOfWeek - Comma-separated day names (e.g., "Monday,Tuesday")
 */
function getNextDateForDaysOfWeek(daysOfWeek: string): string {
  const daysMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const today = new Date();
  const todayDay = today.getDay();

  // Split and trim day names
  const days = daysOfWeek
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  // Find the minimum diff (>= 0) for all days
  let minDiff = 7;
  for (const day of days) {
    const targetDay = daysMap[day];
    if (targetDay === undefined) continue;
    let diff = targetDay - todayDay;
    if (diff < 0) diff += 7;
    if (diff < minDiff) minDiff = diff;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + minDiff);

  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, "0");
  const day = String(nextDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const getOrdinalSuffix = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};
