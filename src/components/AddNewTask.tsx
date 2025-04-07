import React, { useState } from "react";
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

interface AddNewTaskProps {
  handleAdding: () => void;
}

const AddNewTask = ({ handleAdding }: AddNewTaskProps) => {
  //For task name
  const [taskName, setTaskName] = useState("");

  //For urgency
  const [urgent, setUrgent] = useState(1);
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

  const [typeOfTask, setTypeOfTask] = useState("steps");

  const [subTask, setSubTask] = useState("");

  // For repitition
  const valuesOfRepitition = [
    { value: "days", text: "Days Of Week" },
    { value: "date", text: "Specific Date" },
  ];

  const [repitition, setTRepitition] = useState("date");

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
    const valuesToBeSent = {
      label: taskName,
      type: typeOfTask,
      items: subTask.split("\n"),
      checked: typeOfTask === "checked" ? [] : -1,
      imp: urgent,
      noDelete: !deleteTask,
      repeatOn: repitition === "date" ? dateDisplayed : slectedValues,
      reset: resetTask,
    };

    const config = {
      method: "post",
      url: "http://localhost:3001/api/tasks",
      headers: {
        "Content-Type": "application/json",
      },
      data: valuesToBeSent,
    };

    axios(config)
      .then(() => {
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
      .catch(function (error) {
        console.log(error);
      });
  };

  return (
    <>
      <Form layout="vertical">
        <Form.Item label="What you want to get done ? ">
          <Input
            placeholder=""
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <span style={{ marginRight: 20 }}>How urgent is it ? </span>
          <RatingCreator
            names={describeUrgency}
            value={urgent}
            setValue={(val) => setUrgent(val)}
          />
        </Form.Item>

        <Form.Item label="What are the kind of following steps ">
          <ButtonGroupsCreator
            values={valuesOfTaskType}
            currentValue={typeOfTask}
            onChange={(e) => setTypeOfTask(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="TextArea">
          <TextArea
            rows={4}
            value={subTask}
            onChange={(e) => setSubTask(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="Frequency Of Repetition">
          <ButtonGroupsCreator
            values={valuesOfRepitition}
            currentValue={repitition}
            onChange={(e) => setTRepitition(e.target.value)}
          />
        </Form.Item>

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

        <Form.Item
          wrapperCol={{ offset: 8, span: 16 }}
          style={{ paddingBottom: "30px" }}
        >
          <Button
            type="primary"
            htmlType="submit"
            onClick={() => handleSubmit()}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default AddNewTask;
