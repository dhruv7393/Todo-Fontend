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
  Typography,
  Alert,
} from "@mui/material";
import { endpoint, useMock } from "./TaskUtil";
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

interface DeleteTaskProps {
  open: boolean;
  onClose: () => void;
  onDeleteTask: (taskToDelete: Task, editedParentTasks: Task[]) => void;
  tasks: Task[];
}

const DeleteTask = ({
  open,
  onClose,
  onDeleteTask,
  tasks,
}: DeleteTaskProps) => {
  const [selectedTaskPath, setSelectedTaskPath] = useState<string>("");

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

  const getTasksContainingAsSubtask = (taskId: string): Task[] => {
    return tasks.filter((task) => task.listOfSubTasks.includes(taskId));
  };

  const getAllSubtasksRecursively = (
    taskId: string,
    visited = new Set<string>()
  ): string[] => {
    if (visited.has(taskId)) return []; // Prevent infinite loops
    visited.add(taskId);

    const task = tasks.find((t) => t._id === taskId);
    if (!task) return [];

    const allSubtasks = [taskId];

    task.listOfSubTasks.forEach((subTaskId) => {
      allSubtasks.push(...getAllSubtasksRecursively(subTaskId, visited));
    });

    return allSubtasks;
  };

  const handleTaskSelection = (path: string) => {
    setSelectedTaskPath(path);
  };

  const handleClose = () => {
    setSelectedTaskPath("");
    onClose();
  };

  const handleDelete = () => {
    if (!selectedTaskPath) return;

    const selectedTask = getSelectedTask(selectedTaskPath);
    if (!selectedTask) return;

    // Get all tasks that will be deleted (including nested subtasks)
    const allTasksToDelete = getAllSubtasksRecursively(selectedTask._id);

    // Find all parent tasks that contain any of the tasks to be deleted as subtasks
    const editedParentTasks: Task[] = [];

    tasks.forEach((task) => {
      const hasSubtasksToDelete = task.listOfSubTasks.some((subTaskId) =>
        allTasksToDelete.includes(subTaskId)
      );

      if (hasSubtasksToDelete) {
        const updatedTask = {
          ...task,
          listOfSubTasks: task.listOfSubTasks.filter(
            (subTaskId) => !allTasksToDelete.includes(subTaskId)
          ),
        };
        editedParentTasks.push(updatedTask);
      }
    });

    if (useMock) {
      console.log("Delete - Task to be deleted:", selectedTask);
      onDeleteTask(selectedTask, editedParentTasks);
      handleClose();
    } else {
      axios
        .delete(`${endpoint}/${selectedTask._id}`)
        .then(() => {
          console.log("Delete - Task deleted successfully");
          onDeleteTask(selectedTask, editedParentTasks);
          handleClose();
        })
        .catch((error) => {
          console.error("Delete - Error deleting task:", error);
        });
    }
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

  const selectedTask = getSelectedTask(selectedTaskPath);
  const hasSubtasks = selectedTask && selectedTask.listOfSubTasks.length > 0;
  const parentTasks = selectedTask
    ? getTasksContainingAsSubtask(selectedTask._id)
    : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {/* Task Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Task to Delete</InputLabel>
            <Select
              value={selectedTaskPath}
              onChange={(e) => handleTaskSelection(e.target.value)}
              label="Select Task to Delete"
            >
              {renderTaskHierarchy(tasks)}
            </Select>
          </FormControl>

          {/* Task Information and Warnings */}
          {selectedTask && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6" color="error">
                ⚠️ Delete Task: {selectedTask.taskName}
              </Typography>

              {hasSubtasks && (
                <Alert severity="warning">
                  <strong>Warning:</strong> This task has{" "}
                  {selectedTask.listOfSubTasks.length} subtask(s). Deleting this
                  task will also delete all its subtasks permanently.
                  <br />
                  <strong>Subtasks to be deleted:</strong>
                  <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                    {selectedTask.listOfSubTasks.map((subTaskId) => {
                      const subTask = tasks.find((t) => t._id === subTaskId);
                      return subTask ? (
                        <li key={subTaskId}>{subTask.taskName}</li>
                      ) : null;
                    })}
                  </ul>
                </Alert>
              )}

              {parentTasks.length > 0 && (
                <Alert severity="info">
                  <strong>Note:</strong> This task will be removed from{" "}
                  {parentTasks.length} parent task(s):
                  <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                    {parentTasks.map((parentTask) => (
                      <li key={parentTask._id}>{parentTask.taskName}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary">
                <strong>Task Details:</strong>
                <br />
                Status: {selectedTask.isDone ? "Completed" : "Pending"}
                <br />
                Carry Out: {selectedTask.carryOutOn}
                <br />
                Date: {selectedTask.dateOfCarryOut}
                <br />
                Can Be Reset: {selectedTask.canBeReseted ? "Yes" : "No"}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={!selectedTaskPath}
        >
          Delete Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTask;
