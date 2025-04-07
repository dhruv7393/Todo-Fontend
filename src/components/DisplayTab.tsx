import { TabCreator } from "ux-component";
import DisplayTask from "./DisplayTask";
import { useEffect, useState } from "react";
import { PlusCircleFilled } from "@ant-design/icons";
import AddNewTask from "./AddNewTask";

import tasksMock from "../mock/Tasks.json";
import axios from "axios";

export interface TaskProps {
  _id: string;
  label: string;
  type: string;
  items: string[];
  checked: string[] | number;
  imp: number;
  noDelete: boolean;
  repeatOn: string | string[];
  reset: boolean;
}

const useLocalMock: boolean = false;

const DisplayTab = () => {
  const [tab, setTab] = useState("today");

  const [taskToBeDisplayed, setTaskToBeDisplayed] = useState<TaskProps[]>([]);

  const getTasksFromApi = () => {
    if (useLocalMock) {
      setTaskToBeDisplayed(tasksMock);
    } else {
      axios
        .get("http://localhost:3001/api/tasks")
        .then(({ data }) => setTaskToBeDisplayed(data))
        .catch((error) => {
          console.log(error);
        });
    }
  };

  useEffect(() => {
    getTasksFromApi();
  }, []);

  const handleDelete = (id: string) => {
    setTaskToBeDisplayed((tasks) => [
      ...tasks.filter((task) => task["_id"] !== id),
    ]);
  };

  const handleUpdate = (id: string, newTask: TaskProps) => {
    setTaskToBeDisplayed((tasks) => [
      ...tasks.filter((task) => task["_id"] !== id),
      newTask,
    ]);
  };

  const handleAdding = () => getTasksFromApi();

  const childTab = (
    <DisplayTask
      tab={tab}
      tasks={taskToBeDisplayed}
      handleDelete={handleDelete}
      handleUpdate={handleUpdate}
    />
  );

  const items = [
    {
      key: "today",
      label: "Today",
      children: childTab,
    },
    {
      key: "later",
      label: "Later",
      children: childTab,
    },
    {
      key: "done",
      label: "Done",
      children: childTab,
    },
    {
      key: "add",
      label: <PlusCircleFilled />,
      children: <AddNewTask handleAdding={handleAdding} />,
    },
  ];
  return (
    <>
      <TabCreator
        items={items}
        onChange={(key) => setTab(key)}
        centered={true}
      />
    </>
  );
};

export default DisplayTab;
