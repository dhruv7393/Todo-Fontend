import { CollapseCreator } from "ux-component";
import FilterTaskAsPerCategory from "./FilterTaskAsPerCategory";
import DisplayTaskHeaders from "./DisplayTaskHeaders";
import DisplayCarousel from "./DisplayCarousel";
import { TaskProps } from "./DisplayTab";

interface TaskToBeDisplayedProps {
  tab: string;
  tasks: TaskProps[];
  handleDelete: (id: string) => void;
  handleUpdate: (id: string, newTask: TaskProps) => void;
}

const DisplayTask = ({
  tab,
  tasks,
  handleDelete,
  handleUpdate,
}: TaskToBeDisplayedProps) => {
  const items = FilterTaskAsPerCategory(tasks, tab)
    .sort((a: TaskProps, b: TaskProps) => b.imp - a.imp)
    .map((task: TaskProps) => {
      return {
        key: task["_id"],
        label: task.label,
        children: <DisplayCarousel task={task} handleUpdate={handleUpdate} />,
        className: "level" + task.imp,
        extra: DisplayTaskHeaders(task.noDelete, task, handleDelete),
      };
    });

  return (
    <>
      <CollapseCreator items={items} />
    </>
  );
};

export default DisplayTask;
