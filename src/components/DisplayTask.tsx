import { CollapseCreator } from "ux-component";
import FilterTaskAsPerCategory from "./FilterTaskAsPerCategory";
import DisplayTaskHeaders from "./DisplayTaskHeaders";
import DisplayCarousel from "./DisplayCarousel";
import { TaskProps } from "./DisplayTab";
import { CollapseCreatorPropsObj } from "ux-component/src/component/CollapseCreator";
import { openNotificationWithIconProps } from "../App";

interface TaskToBeDisplayedProps {
  tab: string;
  tasks: TaskProps[];
  handleDelete: (id: string) => void;
  handleUpdate: (id: string, newTask: TaskProps) => void;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const DisplayTask = ({
  tab,
  tasks,
  handleDelete,
  handleUpdate,
  openNotificationWithIcon,
}: TaskToBeDisplayedProps) => {
  const filterAndSortedItems = FilterTaskAsPerCategory(tasks, tab).sort(
    (a: TaskProps, b: TaskProps) => {
      if (a.imp !== b.imp) {
        return b.imp - a.imp; // sort by 'imp' ascending
      }
      // Then by 'noDelete' (boolean) - true first
      if (a.noDelete !== b.noDelete) {
        return a.noDelete === true ? -1 : 1;
      }
      return a.label.localeCompare(b.label); // then by 'label' alphabetically
    }
  );

  const items = filterAndSortedItems.map((task: TaskProps) => {
    const returnedElement: CollapseCreatorPropsObj = {
      key: task["_id"],
      label: task.label,
      children: (
        <DisplayCarousel
          task={task}
          handleUpdate={handleUpdate}
          openNotificationWithIcon={openNotificationWithIcon}
        />
      ),
      className: "level" + task.imp,
      extra: DisplayTaskHeaders(
        task.noDelete,
        task,
        handleDelete,
        openNotificationWithIcon
      ),
    };
    return returnedElement;
  });

  return (
    <>
      <CollapseCreator items={items} />
    </>
  );
};

export default DisplayTask;
