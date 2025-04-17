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

import countValues from "../mock/StreakCount.json";
import DisplayStreakCount from "./DisplayStreakCount";

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

  const [activeDays, setActiveDays] = useState("0");
  const [weekDays, setWeekDays] = useState("0");

  const [sincerity, setSincerity] = useState({
    Goon: 0,
    "6 Pack Abs": 0,
    FIRE: 0,
    "Hu To Ayvo": 0,
    Introspection: 0,
    "Project Happy": 0,
    "Read To Grow": 0,
    Techie: 0,
    "Thank You": 1,
  });

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

  const streakCountFromApi = () => {
    if (!useLocalMock) {
      const config = {
        method: "get",
        url: import.meta.env.VITE_APP_BACKEND_URL + "streakcount",
        headers: {},
      };
      axios(config)
        .then(({ data }) => {
          //axios
          setActiveDays(() => data[0].activeDays);
          setWeekDays(() => data[0].weekDays);
          setSincerity((sincerely) => {
            return { ...sincerely, ...data[0].sincerity };
          });
        })
        .catch(() => {
          openNotificationWithIcon(
            "error",
            "Streak data could not be loaded",
            "Please refresh the page"
          );
        });
    } else {
      setActiveDays(() => countValues.activeDays);
    }
  };

  useEffect(() => {
    getTasksFromApi();
    streakCountFromApi();
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
      key: "progess",
      label: <StockOutlined />,
      children: (
        <DisplayGrpah
          starStatistics={CountTotalStartsData(taskToBeDisplayed)}
          activeDays={parseInt(activeDays)}
          weekDays={parseInt(weekDays)}
          sincerity={sincerity}
          openNotificationWithIcon={openNotificationWithIcon}
        />
      ),
    },
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
  ];
  return (
    <>
      <DisplayStreakCount
        weekDays={weekDays.toString()}
        activeDays={activeDays.toString()}
      />
      <TabCreator
        items={items}
        onChange={(key) => setTab(key)}
        centered={true}
        defaultValue="today"
      />
    </>
  );
};

export default DisplayTab;
