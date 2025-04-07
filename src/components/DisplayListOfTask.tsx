import { CheckboxCreator } from "ux-component";
import { TaskProps } from "./DisplayTab";
import axios from "axios";

interface DisplayListOfTaskProps {
  task: TaskProps;
  handleUpdate: (id: string, newTask: TaskProps) => void;
}

const DisplayListOfTask = ({ task, handleUpdate }: DisplayListOfTaskProps) => {
  const handleListClick = (items: string[]) => {
    const config = {
      method: "patch",
      url: "http://localhost:3001/api/tasks/" + task["_id"],
      headers: {
        "Content-Type": "application/json",
      },
      data: { checked: items },
    };

    axios(config)
      .then(() => {
        const newTask = { ...task, checked: items };
        handleUpdate(task["_id"], newTask);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  return (
    <>
      <CheckboxCreator
        items={task.items}
        checked={task.checked}
        onChange={(items) => handleListClick(items)}
      />
    </>
  );
};

export default DisplayListOfTask;
