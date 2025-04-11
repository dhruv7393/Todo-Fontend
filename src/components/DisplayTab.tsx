import { TabCreator } from "ux-component";
import DisplayTask from "./DisplayTask";
import { useEffect, useState } from "react";
import { PlusCircleFilled, StockOutlined } from "@ant-design/icons";
import AddNewTask from "./AddNewTask";

import tasksMock from "../mock/Tasks.json";
import axios from "axios";
import { TabCreatorProps } from "ux-component/src/component/TabCreator";
import { openNotificationWithIconProps } from "../App";
import { useLocalMock } from "../utilities/mock";
import CountTotalStartsData from "../utilities/CountTotalStartsData";
import DisplayGrpah from "./DisplayGrpah";

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

const DisplayTab = ({
  openNotificationWithIcon,
}: openNotificationWithIconProps) => {
  const [tab, setTab] = useState("today");

  const [taskToBeDisplayed, setTaskToBeDisplayed] = useState<TaskProps[]>([]);

  const getTasksFromApi = () => {
    if (useLocalMock) {
      setTaskToBeDisplayed(tasksMock);
    } else {
      axios
        .get(import.meta.env.VITE_APP_BACKEND_URL + "tasks")
        .then(({ data }) => {
          setTab(() => "today");
          setTaskToBeDisplayed(() => data);
        })
        .catch(() => {
          openNotificationWithIcon(
            "error",
            "ToDo's could not be loaded",
            "Please refresh the page"
          );
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

  const handleAdding = () => {
    getTasksFromApi();
  };

  const childTab = (
    <DisplayTask
      tab={tab}
      tasks={taskToBeDisplayed}
      handleDelete={handleDelete}
      handleUpdate={handleUpdate}
      openNotificationWithIcon={openNotificationWithIcon}
    />
  );

  const items: TabCreatorProps["items"] = [
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
      children: (
        <AddNewTask
          handleAdding={handleAdding}
          openNotificationWithIcon={openNotificationWithIcon}
        />
      ),
    },
    {
      key: "progess",
      label: <StockOutlined />,
      children: (
        <DisplayGrpah
          starStatistics={CountTotalStartsData(taskToBeDisplayed)}
        />
      ),
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
