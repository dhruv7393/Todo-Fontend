import { useEffect, useState } from "react";
import { TaskProps } from "./DisplayTab";
import { ModalCreator, RatingCreator, SwitchCreator } from "ux-component";
import { Button, Form } from "antd";
import axios from "axios";
import { openNotificationWithIconProps } from "../App";

interface DisplayImpAndResetProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const DisplayImpAndReset = ({
  task,
  handleUpdate,
  openNotificationWithIcon,
}: DisplayImpAndResetProps) => {
  const [newImp, setNewImp] = useState<number>(0);
  const [newReset, setReset] = useState<boolean>(task.reset);
  const describeUrgency = [
    "Take Your Time",
    "A Bit Urgent",
    "High Priority",
    "Extremely Uregnt",
    "Exceptionally Urgent",
  ];
  useEffect(() => {
    setNewImp(() => task.imp);
    setReset(() => task.reset);
  }, []);

  const changeInImportance = newImp !== task.imp;
  const changeInReset = newReset !== task.reset;

  const valueChanged = changeInImportance || changeInReset;
  const updateText =
    (changeInImportance ? "importance as " + newImp : "") +
    (changeInImportance && changeInReset ? " and " : "") +
    (changeInReset ? "reset as " + newReset : "");

  const handleSubmit = () => {
    const config = {
      method: "patch",
      url: import.meta.env.VITE_APP_BACKEND_URL + "tasks/" + task["_id"],
      headers: {
        "Content-Type": "application/json",
      },
      data: { imp: newImp, reset: newReset },
    };

    axios(config)
      .then(() => {
        const newTask = { ...task, imp: newImp, reset: newReset };
        handleUpdate(task["_id"], newTask);
        openNotificationWithIcon(
          "success",
          "Yupi!!!",
          task.label + "has been updated with " + updateText
        );
      })
      .catch(() => {
        openNotificationWithIcon(
          "error",
          "Damm!!!",
          task.label + " could not be updated. Please re-try"
        );
      });
  };
  return (
    <>
      <Form.Item>
        <span style={{ marginRight: 20 }}>How urgent is it ? </span>
        <RatingCreator
          names={describeUrgency}
          value={newImp}
          setValue={(val) => setNewImp(val)}
        />
      </Form.Item>
      <Form.Item>
        <span style={{ marginRight: 20 }}>Can the task be reseted</span>
        <SwitchCreator
          checked={newReset}
          onChange={() => setReset((res) => !res)}
        />
      </Form.Item>

      {(valueChanged && (
        <>
          <ModalCreator
            button={
              <Button
                type="primary"
                htmlType="submit"
                onClick={() => {}}
                style={{
                  display: "block",
                  margin: "auto",
                }}
              >
                Submit
              </Button>
            }
            header={"Damm..."}
            message={
              <>
                Do you want to update {<b>{task.label}</b>} with {updateText}?
              </>
            }
            onOK={() => handleSubmit()}
            onCancel={() => {}}
          />
        </>
      )) || <></>}
    </>
  );
};

export default DisplayImpAndReset;
