import { useState, useEffect, useCallback } from "react";
import MockTasks from "../MockTasks.json";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import DeleteIcon from "@mui/icons-material/Delete";
import AddTask from "./AddTask";
import CopyTask from "./CopyTask";
import EditTask from "./EditTask";
import DeleteTask from "./DeleteTask";
import axios from "axios";
import { useMock } from "./TaskUtil";

interface Task {
  _id: string;
  taskName: string;
  isDone: boolean;
  carryOutOn: string;
  dateOfCarryOut: string;
  canBeReseted: boolean;
  listOfSubTasks: string[];
}

const Tasks = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isCopyTaskOpen, setIsCopyTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);

  // Create a map for quick task lookup by ID
  const createTaskMap = useCallback((tasks: Task[]) => {
    return tasks.reduce((map, task) => {
      map[task._id] = task;
      return map;
    }, {} as Record<string, Task>);
  }, []);

  // Get top-level tasks (tasks that are not referenced as subtasks)
  const getTopLevelTasks = useCallback((tasks: Task[]) => {
    const allSubTaskIds = new Set<string>();
    tasks.forEach((task) => {
      task.listOfSubTasks.forEach((subTaskId) => {
        allSubTaskIds.add(subTaskId);
      });
    });

    return tasks.filter((task) => !allSubTaskIds.has(task._id));
  }, []);

  // Get subtasks by their IDs
  const getSubTasks = useCallback(
    (subTaskIds: string[], taskMap: Record<string, Task>) => {
      return subTaskIds.map((id) => taskMap[id]).filter(Boolean);
    },
    []
  );

  // Get selected task by path (similar to EditTask component)
  const getSelectedTaskByPath = useCallback(
    (path: string, taskList: Task[]) => {
      if (!path) return null;

      const pathIndices = path.split("-").map(Number);
      const taskMap = taskList.reduce((map, task) => {
        map[task._id] = task;
        return map;
      }, {} as Record<string, Task>);

      // Get top-level tasks
      const allSubTaskIds = new Set<string>();
      taskList.forEach((task) => {
        task.listOfSubTasks.forEach((subTaskId) => {
          allSubTaskIds.add(subTaskId);
        });
      });

      const topLevelTasks = taskList.filter(
        (task) => !allSubTaskIds.has(task._id)
      );

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
    },
    []
  );

  // Sort tasks recursively
  const sortTasks = useCallback((tasks: Task[]): Task[] => {
    return tasks.sort((a, b) => {
      // First, sort by completion status (incomplete tasks first)
      if (a.isDone !== b.isDone) {
        return a.isDone ? 1 : -1;
      }
      // Then sort alphabetically by task name
      return a.taskName.localeCompare(b.taskName);
    });
  }, []);

  const toggleTaskAndSubtasks = useCallback(
    (
      taskId: string,
      newStatus: boolean,
      taskMap: Record<string, Task>
    ): { updatedMap: Record<string, Task>; doneList: Task[] } => {
      const updatedMap = { ...taskMap };
      const doneList: Task[] = [];
      const task = updatedMap[taskId];

      if (!task) return { updatedMap, doneList };

      // Update the task itself
      const updatedTask = { ...task, isDone: newStatus };
      updatedMap[taskId] = updatedTask;

      // Add the updated task to doneList
      doneList.push(updatedTask);

      // Update all subtasks recursively
      task.listOfSubTasks.forEach((subTaskId) => {
        const result = toggleTaskAndSubtasks(subTaskId, newStatus, updatedMap);
        Object.assign(updatedMap, result.updatedMap);
        doneList.push(...result.doneList);
      });

      return { updatedMap, doneList };
    },
    []
  );

  const handleTaskToggle = useCallback(
    (task: Task) => {
      const taskMap = createTaskMap(allTasks);
      const newStatus = !task.isDone;
      const result = toggleTaskAndSubtasks(task._id, newStatus, taskMap);
      const updatedTasks = Object.values(result.updatedMap);

      if (useMock) {
        setAllTasks(updatedTasks);
      } else {
        axios
          .patch(`${import.meta.env.VITE_APP_BACKEND_URL}/${task._id}`, {
            ...task,
            isDone: newStatus,
          })
          .then((response) => {
            console.log("Edit - Task updated:", response.data);
            setAllTasks(updatedTasks);
          })
          .catch((error) => {
            console.error("Error updating task:", error);
          });
      }
    },
    [allTasks, createTaskMap, toggleTaskAndSubtasks]
  );

  const handleAddTask = useCallback(
    (newTask: Omit<Task, "_id">, parentPath?: string) => {
      // Generate a new ID for the task
      const maxId = Math.max(...allTasks.map((t) => parseInt(t._id)), 0);
      const taskWithId: Task = {
        ...newTask,
        _id: (maxId + 1).toString(),
      };

      let updatedTasks: Task[];

      if (!parentPath) {
        // Add as top-level task
        updatedTasks = [...allTasks, taskWithId];
      } else {
        // Add as subtask - find parent by path and add to its listOfSubTasks
        const pathIndices = parentPath.split("-").map(Number);
        const topLevelTasks = getTopLevelTasks(allTasks);
        const taskMap = createTaskMap(allTasks);

        // Navigate to the parent task using the path
        let currentTask = topLevelTasks[pathIndices[0]];
        for (let i = 1; i < pathIndices.length; i++) {
          const subTasks = getSubTasks(currentTask.listOfSubTasks, taskMap);
          currentTask = subTasks[pathIndices[i]];
        }

        // Update the parent task to include the new subtask ID
        const updatedParent = {
          ...currentTask,
          listOfSubTasks: [...currentTask.listOfSubTasks, taskWithId._id],
        };

        updatedTasks = allTasks.map((task) =>
          task._id === updatedParent._id ? updatedParent : task
        );
        updatedTasks.push(taskWithId);
      }

      setAllTasks(updatedTasks);
    },
    [allTasks, getTopLevelTasks, createTaskMap, getSubTasks]
  );

  const handleCopyTask = useCallback(
    (newTask: Omit<Task, "_id">, parentPath?: string) => {
      // Generate a new ID for the copied task (completely independent)
      const maxId = Math.max(...allTasks.map((t) => parseInt(t._id)), 0);
      const copiedTask: Task = {
        _id: (maxId + 1).toString(),
        taskName: newTask.taskName,
        isDone: false, // Always start as not done
        carryOutOn: newTask.carryOutOn,
        dateOfCarryOut: newTask.dateOfCarryOut,
        canBeReseted: newTask.canBeReseted,
        listOfSubTasks: [], // Always start with empty subtasks
      };

      let updatedTasks: Task[];

      if (!parentPath) {
        // Add as top-level task
        updatedTasks = [...allTasks, copiedTask];
      } else {
        // Add as subtask - find parent by path and add to its listOfSubTasks
        const pathIndices = parentPath.split("-").map(Number);
        const topLevelTasks = getTopLevelTasks(allTasks);
        const taskMap = createTaskMap(allTasks);

        // Navigate to the parent task using the path
        let currentTask = topLevelTasks[pathIndices[0]];
        for (let i = 1; i < pathIndices.length; i++) {
          const subTasks = getSubTasks(currentTask.listOfSubTasks, taskMap);
          currentTask = subTasks[pathIndices[i]];
        }

        // Update the parent task to include the new subtask ID
        const updatedParent = {
          ...currentTask,
          listOfSubTasks: [...currentTask.listOfSubTasks, copiedTask._id],
        };

        updatedTasks = allTasks.map((task) =>
          task._id === updatedParent._id ? updatedParent : task
        );
        updatedTasks.push(copiedTask);
      }

      setAllTasks(updatedTasks);
    },
    [allTasks, getTopLevelTasks, createTaskMap, getSubTasks]
  );

  const handleEditTask = useCallback(
    (editedTask: Task, parentPath?: string) => {
      // Update the existing task with the new data
      let updatedTasks = allTasks.map((task) =>
        task._id === editedTask._id ? editedTask : task
      );

      const editedParentTasks: Task[] = [];

      // If parentPath is provided, we need to handle task re-parenting
      if (parentPath !== undefined) {
        // Remove the task from its current parent (if any)
        updatedTasks = updatedTasks.map((task) => {
          const hadSubtask = task.listOfSubTasks.includes(editedTask._id);
          const updatedTask = {
            ...task,
            listOfSubTasks: task.listOfSubTasks.filter(
              (id) => id !== editedTask._id
            ),
          };

          // Track parent tasks that had their subtasks modified
          if (hadSubtask) {
            editedParentTasks.push(updatedTask);
          }

          return updatedTask;
        });

        // Add the task to the new parent (if parentPath is not empty)
        if (parentPath !== "") {
          const parentTask = getSelectedTaskByPath(parentPath, updatedTasks);
          if (parentTask) {
            updatedTasks = updatedTasks.map((task) => {
              if (task._id === parentTask._id) {
                const updatedParentTask = {
                  ...task,
                  listOfSubTasks: [...task.listOfSubTasks, editedTask._id],
                };

                // Add or update the new parent in editedParentTasks
                const existingIndex = editedParentTasks.findIndex(
                  (t) => t._id === parentTask._id
                );
                if (existingIndex >= 0) {
                  editedParentTasks[existingIndex] = updatedParentTask;
                } else {
                  editedParentTasks.push(updatedParentTask);
                }

                return updatedParentTask;
              }
              return task;
            });
          }
        }
      }

      // Print EditedList only if there were parent task changes
      if (editedParentTasks.length > 0) {
        console.log(
          "Edit - EditedList (parent tasks with updated subtasks):",
          editedParentTasks
        );
      }

      setAllTasks(updatedTasks);
    },
    [allTasks, getSelectedTaskByPath]
  );

  const handleDeleteTask = useCallback(
    (taskToDelete: Task, editedParentTasks: Task[]) => {
      // Get all tasks that need to be deleted (including nested subtasks)
      const getAllSubtasksRecursively = (
        taskId: string,
        visited = new Set<string>()
      ): string[] => {
        if (visited.has(taskId)) return [];
        visited.add(taskId);

        const task = allTasks.find((t) => t._id === taskId);
        if (!task) return [];

        const allSubtasks = [taskId];

        task.listOfSubTasks.forEach((subTaskId) => {
          allSubtasks.push(...getAllSubtasksRecursively(subTaskId, visited));
        });

        return allSubtasks;
      };

      const allTaskIdsToDelete = getAllSubtasksRecursively(taskToDelete._id);

      // Remove all tasks to be deleted
      let updatedTasks = allTasks.filter(
        (task) => !allTaskIdsToDelete.includes(task._id)
      );

      // Update parent tasks to remove deleted task IDs from their subtask lists
      editedParentTasks.forEach((editedParent) => {
        updatedTasks = updatedTasks.map((task) =>
          task._id === editedParent._id ? editedParent : task
        );
      });

      setAllTasks(updatedTasks);
    },
    [allTasks]
  );

  // Function to check if a task is due today or earlier
  const isTaskDueToday = useCallback((task: Task): boolean => {
    const today = new Date();
    const taskDate = new Date(task.dateOfCarryOut);
    return taskDate <= today;
  }, []);

  // Function to categorize tasks based on due date
  const categorizeTasks = useCallback(
    (
      tasks: Task[],
      taskMap: Record<string, Task>
    ): {
      dueToday: Task[];
      future: Task[];
    } => {
      const dueToday: Task[] = [];
      const future: Task[] = [];

      tasks.forEach((task) => {
        // Check if task or any of its subtasks are due today or earlier
        const hasTaskDueToday = (currentTask: Task): boolean => {
          if (isTaskDueToday(currentTask)) {
            return true;
          }
          // Check subtasks recursively
          return currentTask.listOfSubTasks.some((subTaskId) => {
            const subTask = taskMap[subTaskId];
            return subTask && hasTaskDueToday(subTask);
          });
        };

        if (hasTaskDueToday(task)) {
          dueToday.push(task);
        } else {
          future.push(task);
        }
      });

      return { dueToday, future };
    },
    [isTaskDueToday]
  );

  useEffect(() => {
    if (useMock) {
      setAllTasks(MockTasks as Task[]);
    } else {
      axios
        .get(import.meta.env.VITE_APP_BACKEND_URL)
        .then((response) => {
          setAllTasks(response.data);
        })
        .catch((error) => {
          console.error("Error fetching tasks:", error);
        });
    }
  }, []);

  const taskMap = createTaskMap(allTasks);
  const topLevelTasks = getTopLevelTasks(allTasks);
  const { dueToday, future } = categorizeTasks(topLevelTasks, taskMap);
  const sortedDueTodayTasks = sortTasks(dueToday);
  const sortedFutureTasks = sortTasks(future);

  return (
    <div className="parchment">
      <h2>
        Tasks{" "}
        <AddCircleIcon
          style={{
            cursor: "pointer",
            fontSize: "1em",
            marginLeft: "0.5em",
            verticalAlign: "middle",
          }}
          onClick={() => setIsAddTaskOpen(true)}
        />
        <ContentCopyIcon
          style={{
            cursor: "pointer",
            fontSize: "1em",
            marginLeft: "0.5em",
            verticalAlign: "middle",
          }}
          onClick={() => setIsCopyTaskOpen(true)}
        />
        <EditDocumentIcon
          style={{
            cursor: "pointer",
            fontSize: "1em",
            marginLeft: "0.5em",
            verticalAlign: "middle",
          }}
          onClick={() => setIsEditTaskOpen(true)}
        />
        <DeleteIcon
          style={{
            cursor: "pointer",
            fontSize: "1em",
            marginLeft: "0.5em",
            verticalAlign: "middle",
            color: "#d32f2f",
          }}
          onClick={() => setIsDeleteTaskOpen(true)}
        />
      </h2>

      {/* Tasks due today or earlier */}
      {sortedDueTodayTasks.length > 0 && (
        <div>
          <h3 style={{ color: "#d32f2f", marginBottom: "10px" }}>
            Due Today or Earlier
          </h3>
          <ShowTask
            tasks={sortedDueTodayTasks}
            taskMap={taskMap}
            padded={0}
            onTaskToggle={handleTaskToggle}
          />
        </div>
      )}

      {/* Divider */}
      {sortedDueTodayTasks.length > 0 && sortedFutureTasks.length > 0 && (
        <hr
          style={{
            margin: "20px 0",
            border: "1px solid #ccc",
            background: "#ccc",
          }}
        />
      )}

      {/* Future tasks */}
      {sortedFutureTasks.length > 0 && (
        <div>
          <h3 style={{ color: "#1976d2", marginBottom: "10px" }}>
            Future Tasks
          </h3>
          <ShowTask
            tasks={sortedFutureTasks}
            taskMap={taskMap}
            padded={0}
            onTaskToggle={handleTaskToggle}
          />
        </div>
      )}

      <AddTask
        open={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        tasks={allTasks}
      />
      <CopyTask
        open={isCopyTaskOpen}
        onClose={() => setIsCopyTaskOpen(false)}
        onCopyTask={handleCopyTask}
        tasks={allTasks}
      />
      <EditTask
        open={isEditTaskOpen}
        onClose={() => setIsEditTaskOpen(false)}
        onEditTask={handleEditTask}
        tasks={allTasks}
      />
      <DeleteTask
        open={isDeleteTaskOpen}
        onClose={() => setIsDeleteTaskOpen(false)}
        onDeleteTask={handleDeleteTask}
        tasks={allTasks}
      />
    </div>
  );
};

const ShowTask = ({
  tasks,
  taskMap,
  padded,
  onTaskToggle,
}: {
  tasks: Task[];
  taskMap: Record<string, Task>;
  padded: number;
  onTaskToggle: (task: Task) => void;
}) => (
  <ul
    style={{
      listStyleType: "none",
      marginLeft: `${padded}px`,
      paddingLeft: "0",
    }}
  >
    {tasks.map((task) => {
      const subTasks = task.listOfSubTasks
        .map((id) => taskMap[id])
        .filter(Boolean);
      const sortedSubTasks = subTasks.sort((a, b) => {
        if (a.isDone !== b.isDone) {
          return a.isDone ? 1 : -1;
        }
        return a.taskName.localeCompare(b.taskName);
      });

      return (
        <li key={task._id}>
          <h4 className="taskHeaders">
            <span
              style={{
                fontSize: "0.5em",
                marginRight: "0.5em",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => onTaskToggle(task)}
            >
              {task.isDone ? "☑️" : "⬜️"}
            </span>
            <span
              style={{
                textDecoration: task.isDone ? "line-through" : "none",
              }}
            >
              {task.taskName} (
              {new Date(task.dateOfCarryOut).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              )
            </span>
            <br />
            {sortedSubTasks.length > 0 && (
              <ShowTask
                tasks={sortedSubTasks}
                taskMap={taskMap}
                padded={padded + 20}
                onTaskToggle={onTaskToggle}
              />
            )}
          </h4>
        </li>
      );
    })}
  </ul>
);

export default Tasks;
