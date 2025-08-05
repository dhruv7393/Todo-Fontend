import React, { type ReactElement } from "react";
import { MenuItem } from "@mui/material";
import type { Task } from "./TaskTypes";

/**
 * Renders a hierarchy of tasks as nested MenuItems for use in Select components.
 * @param taskList The list of all tasks.
 * @param level The current nesting level (default 0).
 * @param parentPath The path to the parent task (default []).
 * @returns Array of React MenuItem elements representing the task hierarchy.
 */
export function renderTaskHierarchy(
  taskList: Task[],
  level = 0,
  parentPath: number[] = []
): ReactElement[] {
  // Create a task map for quick lookup
  const taskMap = taskList.reduce((map, task) => {
    map[task._id] = task;
    return map;
  }, {} as Record<string, Task>);

  // Get top-level tasks (tasks that are not referenced as subtasks)
  const allSubTaskIds = new Set<string>();
  taskList.forEach((task) => {
    task.listOfSubTasks.forEach((subTaskId: string) => {
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
        React.createElement(
          MenuItem,
          {
            key: pathString,
            value: pathString,
            style: { paddingLeft: currentLevel * 20 + 16 },
          },
          `${"  ".repeat(currentLevel)}→ ${task.taskName}`
        )
      );

      // Add all subtasks
      if (task.listOfSubTasks.length > 0) {
        const subTasks = task.listOfSubTasks
          .map((id: string) => taskMap[id])
          .filter(Boolean);

        elements.push(
          ...renderTasksRecursive(subTasks, currentLevel + 1, taskPath)
        );
      }
    });

    return elements;
  };

  return renderTasksRecursive(topLevelTasks, level, parentPath);
}

export const useMock = false;
export const endpoint = import.meta.env.VITE_APP_BACKEND_URL + "vaccation/";
