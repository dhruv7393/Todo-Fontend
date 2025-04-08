import { StepsCreator } from "ux-component";
import { TaskProps } from "./DisplayTab";
import axios from "axios";

interface DisplayStepsOfTaskProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
}

const DisplayStepsOfTask = ({
  task,
  handleUpdate,
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
        handleUpdate(task["_id"], newTask);
      })
      .catch(function (error) {
        console.log(error);
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
