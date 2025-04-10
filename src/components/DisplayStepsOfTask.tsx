import { StepsCreator } from "ux-component";
import { TaskProps } from "./DisplayTab";
import axios from "axios";
import { openNotificationWithIconProps } from "../App";

interface DisplayStepsOfTaskProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const DisplayStepsOfTask = ({
  task,
  handleUpdate,
  openNotificationWithIcon,
}: DisplayStepsOfTaskProps) => {
  const CurrentChecked: number =
    typeof task.checked === "object" ? -1 : task.checked;
  const handleListClick = async (item: number) => {
    const config = {
      method: "patch",
      url: import.meta.env.VITE_APP_BACKEND_URL + "tasks/" + task["_id"],
      headers: {
        "Content-Type": "application/json",
      },
      data: { checked: item },
    };

    await axios(config)
      .then(() => {
        const newTask = { ...task, checked: item };
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
      <StepsCreator
        items={task.items.map((title: string) => {
          return { title: title };
        })}
        current={CurrentChecked}
        onChange={(current) => {
          handleListClick(current);
        }}
      />
    </>
  );
};

export default DisplayStepsOfTask;
