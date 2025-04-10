import { useState } from "react";
import { Button, Form, Input } from "antd";
import {
  ButtonGroupsCreator,
  CalendarCreator,
  RatingCreator,
  SelectCreator,
  SwitchCreator,
} from "ux-component";
import { CalendarCreatorProps } from "ux-component/src/component/CalendarCreator";
import TextArea from "antd/es/input/TextArea";
import { SelectCreatorProps } from "ux-component/src/component/SelectCreator";
import axios from "axios";
import { openNotificationWithIconProps } from "../App";

interface AddNewTaskProps {
  handleAdding: () => void;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const AddNewTask = ({
  handleAdding,
  openNotificationWithIcon,
}: AddNewTaskProps) => {
  //For task name
  const [taskName, setTaskName] = useState("");

  //For urgency
  const [urgent, setUrgent] = useState(0);
  const describeUrgency = [
    "Take Your Time",
    "A Bit Urgent",
    "High Priority",
    "Extremely Uregnt",
    "Exceptionally Urgent",
  ];

  // For type
  const valuesOfTaskType = [
    { value: "checked", text: "List Of ToDOs" },
    { value: "steps", text: "List Of Steps" },
  ];

  const [typeOfTask, setTypeOfTask] = useState("");

  const [subTask, setSubTask] = useState("");

  // For repitition
  const valuesOfRepitition = [
    { value: "days", text: "Days Of Week" },
    { value: "date", text: "Specific Date" },
  ];

  const [repitition, setTRepitition] = useState("");

  const [slectedValues, handleSelectedValues] = useState<string[]>([]);
  const daysOfWeek: SelectCreatorProps["optionValues"] = [
    { label: "Sun", value: "Sunday" },
    { label: "Mon", value: "Monday" },
    { label: "Tue", value: "Tuesday" },
    { label: "Wed", value: "Wednesday" },
    { label: "Thu", value: "Thursday" },
    { label: "Fri", value: "Friday" },
    { label: "Sat", value: "Saturday" },
  ];
  const updateSelectedValues = (value: string[]) => {
    handleSelectedValues(value);
  };

  const [dateDisplayed, setDateDisplayed] = useState(
    new Date().toLocaleDateString()
  );
  const handleDateChange: CalendarCreatorProps["handleDateChange"] = (
    dateSelected: string
  ) => setDateDisplayed(dateSelected);

  // no delete
  const [deleteTask, handleDeleteTask] = useState(true);

  // reset task
  const [resetTask, handleResetTask] = useState(false);

  const handleSubmit = () => {
    const listOfThingsToDo = subTask.split("\n");
    if (typeOfTask === "steps") {
      listOfThingsToDo.push("Finish");
    }
    const valuesToBeSent = {
      label: taskName,
      type: typeOfTask,
      items: listOfThingsToDo,
      checked: typeOfTask === "checked" ? [] : -1,
      imp: urgent,
      noDelete: !deleteTask,
      repeatOn: repitition === "date" ? dateDisplayed : slectedValues,
      reset: resetTask,
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_APP_BACKEND_URL + "tasks",
      headers: {
        "Content-Type": "application/json",
      },
      data: valuesToBeSent,
    };

    axios(config)
      .then(() => {
        openNotificationWithIcon("success", taskName + " has been added", "");
        setTaskName(() => "");
        setTypeOfTask(() => "steps");
        setSubTask(() => "");
        setUrgent(() => 1);
        handleDeleteTask(() => true);
        setTRepitition(() => "date");
        setDateDisplayed(() => new Date().toLocaleDateString());
        handleSelectedValues(() => []);
        handleResetTask(() => false);
        handleAdding();
      })
      .catch(() => {
        openNotificationWithIcon(
          "error",
          "Damm..",
          "Task could not be added, please re-try"
        );
      });
  };

  return (
    <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
      <Form layout="vertical">
        <Form.Item label="What you want to get done ? ">
          <Input
            placeholder=""
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </Form.Item>
        {(taskName.length && (
          <Form.Item>
            <span style={{ marginRight: 20 }}>How urgent is it ? </span>
            <RatingCreator
              names={describeUrgency}
              value={urgent}
              setValue={(val) => setUrgent(val)}
            />
          </Form.Item>
        )) || <></>}

        {(urgent > 0 && (
          <Form.Item label="What are the kind of following steps ">
            <ButtonGroupsCreator
              values={valuesOfTaskType}
              currentValue={typeOfTask}
              onChange={(e) => setTypeOfTask(e.target.value)}
            />
          </Form.Item>
        )) || <></>}

        {(typeOfTask && (
          <Form.Item label="List Of Subtasks / Steps :">
            <TextArea
              rows={4}
              value={subTask}
              onChange={(e) => setSubTask(e.target.value)}
            />
          </Form.Item>
        )) || <></>}

        {(subTask && (
          <Form.Item label="Frequency Of Repetition">
            <ButtonGroupsCreator
              values={valuesOfRepitition}
              currentValue={repitition}
              onChange={(e) => setTRepitition(e.target.value)}
            />
          </Form.Item>
        )) || <></>}

        {(repitition === "days" && (
          <Form.Item label="Days on which you would do? ">
            <SelectCreator
              slectedValues={slectedValues}
              optionValues={daysOfWeek}
              onChange={updateSelectedValues}
            />
          </Form.Item>
        )) || <></>}

        {(repitition === "date" && (
          <Form.Item label="Scheduled For -  ">
            <CalendarCreator
              dateDisplayed={dateDisplayed}
              handleDateChange={handleDateChange}
            />
          </Form.Item>
        )) || <></>}

        <Form.Item>
          <span style={{ marginRight: 20 }}>Can the task be deleted</span>
          <SwitchCreator
            checked={deleteTask}
            onChange={() => handleDeleteTask((task) => !task)}
          />
        </Form.Item>

        <Form.Item>
          <span style={{ marginRight: 20 }}>Can the task be reseted</span>
          <SwitchCreator
            checked={resetTask}
            onChange={() => handleResetTask((task) => !task)}
          />
        </Form.Item>

        <div style={{ paddingBottom: "50px" }}>
          <Button
            type="primary"
            htmlType="submit"
            onClick={() => handleSubmit()}
            style={{
              display: "block",
              margin: "auto",
            }}
            disabled={repitition.length < 1}
          >
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddNewTask;
