import { CheckboxCreator } from "ux-component";
import { TaskProps } from "./DisplayTab";
import axios from "axios";
import { openNotificationWithIconProps } from "../App";

interface DisplayListOfTaskProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const DisplayListOfTask = ({
  task,
  handleUpdate,
  openNotificationWithIcon,
}: DisplayListOfTaskProps) => {
  const handleListClick = (items: string[]) => {
    const config = {
      method: "patch",
      url: import.meta.env.VITE_APP_BACKEND_URL + "tasks/" + task["_id"],
      headers: {
        "Content-Type": "application/json",
      },
      data: { checked: items },
    };

    axios(config)
      .then(() => {
        const newTask = { ...task, checked: items };
        openNotificationWithIcon(
          "success",
          "Yupi!!!",
          task.label + "has been updated"
        );
        handleUpdate(task["_id"], newTask);
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
      <CheckboxCreator
        items={task.items}
        checked={typeof task.checked === "number" ? [] : task.checked}
        onChange={(items) => handleListClick(items)}
      />
    </>
  );
};

export default DisplayListOfTask;
