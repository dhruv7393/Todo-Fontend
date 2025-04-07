import { CalendarCreator, CarouselCreator, SelectCreator } from "ux-component";
import DisplayListOfTask from "./DisplayListOfTask";
import DisplayStepsOfTask from "./DisplayStepsOfTask";
import { useState } from "react";
import { TaskProps } from "./DisplayTab";
import axios from "axios";

interface DisplayCarouselProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
}

const DisplayCarousel = ({ task, handleUpdate }: DisplayCarouselProps) => {
  const [currentTask, setCurrentTask] = useState(task);
  const daysOfWeek = [
    { label: "Sun", value: "Sunday" },
    { label: "Mon", value: "Monday" },
    { label: "Tue", value: "Tuesday" },
    { label: "Wed", value: "Wednesday" },
    { label: "Thu", value: "Thursday" },
    { label: "Fri", value: "Friday" },
    { label: "Sat", value: "Saturday" },
  ];

  const handleChangeOfRepition = (value: string | string[]) => {
    const config = {
      method: "patch",
      url: "http://localhost:3001/api/tasks/" + currentTask["_id"],
      headers: {
        "Content-Type": "application/json",
      },
      data: { repeatOn: value },
    };

    axios(config)
      .then(() => {
        setCurrentTask((tsk) => {
          return { ...tsk, repeatOn: value };
        });
        handleUpdate(currentTask["_id"], { ...currentTask, repeatOn: value });
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const elements = [
    task.type === "checked" ? (
      <DisplayListOfTask task={currentTask} handleUpdate={handleUpdate} />
    ) : (
      <DisplayStepsOfTask task={currentTask} handleUpdate={handleUpdate} />
    ),
    typeof task.repeatOn === "string" ? (
      <CalendarCreator
        dateDisplayed={currentTask.repeatOn}
        handleDateChange={handleChangeOfRepition}
      />
    ) : (
      <SelectCreator
        slectedValues={currentTask.repeatOn}
        optionValues={daysOfWeek}
        onChange={handleChangeOfRepition}
      />
    ),
  ];
  return <CarouselCreator elements={elements} onChange={() => {}} />;
};

export default DisplayCarousel;
