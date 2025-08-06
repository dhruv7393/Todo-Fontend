import { useState, useEffect, useCallback } from "react";
import MockTasks from "../MockTasks.json";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { endpoint, useMock } from "./TaskUtil";
import { MenuItem } from "@mui/material";
import TaskForm from "./TaskForm";

export const renderTaskHierarchy = (
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

  const topLevelTasks = taskList.filter((task) => !allSubTaskIds.has(task._id));

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
          .patch(`${endpoint}/${task._id}`, {
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

  const makeAPICall = () => {
    axios
      .get(`${endpoint}`)
      .then((response) => {
        setAllTasks(response.data);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
      });
  };

  useEffect(() => {
    if (useMock) {
      setAllTasks(MockTasks as Task[]);
    } else {
      makeAPICall();
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

      <TaskForm
        open={isAddTaskOpen}
        onClose={() => {
          makeAPICall();
          setIsAddTaskOpen(false);
        }}
        operation="Add"
        tasks={allTasks}
      />
      <TaskForm
        open={isCopyTaskOpen}
        onClose={() => {
          makeAPICall();
          setIsCopyTaskOpen(false);
        }}
        operation="Copy"
        tasks={allTasks}
      />
      <TaskForm
        open={isEditTaskOpen}
        onClose={() => {
          makeAPICall();
          setIsEditTaskOpen(false);
        }}
        operation="Update"
        tasks={allTasks}
      />
      <TaskForm
        open={isDeleteTaskOpen}
        onClose={() => {
          makeAPICall();
          setIsDeleteTaskOpen(false);
        }}
        tasks={allTasks}
        operation="Delete"
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
              {(() => {
                const [year, month, day] = task.dateOfCarryOut
                  .split("-")
                  .map(Number);
                const localDate = new Date(year, month - 1, day);
                return localDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              })()}
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
