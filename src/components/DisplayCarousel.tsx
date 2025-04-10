import {
  CalendarCreator,
  CarouselCreator,
  ModalCreator,
  SelectCreator,
} from "ux-component";
import DisplayListOfTask from "./DisplayListOfTask";
import DisplayStepsOfTask from "./DisplayStepsOfTask";
import { useState } from "react";
import { TaskProps } from "./DisplayTab";
import axios from "axios";
import { Button } from "antd";
import { openNotificationWithIconProps } from "../App";
import DisplayImpAndReset from "./DisplayImpAndReset";

interface DisplayCarouselProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const DisplayCarousel = ({
  task,
  handleUpdate,
  openNotificationWithIcon,
}: DisplayCarouselProps) => {
  const [currentTask, setCurrentTask] = useState(task);
  const [tempValue, setTempValue] = useState<string | string[]>(
    currentTask.repeatOn
  );
  const [displayUpdateButton, setDisplayUpdateButton] = useState(false);
  const daysOfWeek = [
    { label: "Sun", value: "Sunday" },
    { label: "Mon", value: "Monday" },
    { label: "Tue", value: "Tuesday" },
    { label: "Wed", value: "Wednesday" },
    { label: "Thu", value: "Thursday" },
    { label: "Fri", value: "Friday" },
    { label: "Sat", value: "Saturday" },
  ];

  const updateValueOnSubmit = () => {
    const config = {
      method: "patch",
      url: import.meta.env.VITE_APP_BACKEND_URL + "tasks/" + currentTask["_id"],
      headers: {
        "Content-Type": "application/json",
      },
      data: { repeatOn: tempValue },
    };

    axios(config)
      .then(() => {
        setCurrentTask((tsk) => {
          return { ...tsk, repeatOn: tempValue };
        });
        handleUpdate(currentTask["_id"], {
          ...currentTask,
          repeatOn: tempValue,
        });
        openNotificationWithIcon("success", "Yupi..", "Changes are applied!");
      })
      .catch(() => {
        openNotificationWithIcon(
          "error",
          "Damm..",
          "Changes could not be applied!"
        );
      });
  };

  const handleChangeOfRepition = (value: string | string[]) => {
    setTempValue(() => value);
    setDisplayUpdateButton(() => true);
  };

  const ModalCreatorComponent = (typeOfRepeatOn: "days" | "date") => {
    return (
      <ModalCreator
        button={
          <Button
            type="primary"
            style={{
              display: displayUpdateButton ? "block" : "none",
              width: "100%",
            }}
          >
            Update
          </Button>
        }
        header={"Hey there!"}
        message={
          <>
            Do you want to change {typeOfRepeatOn} for {<b>{task.label}</b>} to{" "}
            {tempValue.toString()} instead of {task.repeatOn.toString()}?
          </>
        }
        onOK={() => updateValueOnSubmit()}
        onCancel={() => {
          //setTempValue(() => task.repeatOn);
        }}
      />
    );
  };

  const elements = [
    task.type === "checked" ? (
      <DisplayListOfTask
        task={currentTask}
        handleUpdate={handleUpdate}
        openNotificationWithIcon={openNotificationWithIcon}
      />
    ) : (
      <DisplayStepsOfTask
        task={currentTask}
        handleUpdate={handleUpdate}
        openNotificationWithIcon={openNotificationWithIcon}
      />
    ),
    typeof task.repeatOn === "string" ? (
      <>
        <CalendarCreator
          dateDisplayed={
            typeof currentTask.repeatOn === "object" ? "" : currentTask.repeatOn
          }
          handleDateChange={handleChangeOfRepition}
        />
        {ModalCreatorComponent("date")}
      </>
    ) : (
      <>
        <SelectCreator
          slectedValues={
            typeof currentTask.repeatOn === "object" ? currentTask.repeatOn : []
          }
          optionValues={daysOfWeek}
          onChange={handleChangeOfRepition}
        />
        {ModalCreatorComponent("days")}
      </>
    ),
    <DisplayImpAndReset
      task={task}
      handleUpdate={handleUpdate}
      openNotificationWithIcon={openNotificationWithIcon}
    />,
  ];
  return <CarouselCreator elements={elements} onChange={() => {}} />;
};

export default DisplayCarousel;
