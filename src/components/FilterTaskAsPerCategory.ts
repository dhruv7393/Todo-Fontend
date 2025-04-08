import { TaskProps } from "./DisplayTab";

const FilterTaskAsPerCategory = (tasks: TaskProps[], tab: string) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Fiday",
    "Saturday",
  ];

  // Today's date needed if task needs to be done today
  const todaysDate = new Date();

  //Today's day
  const todaysDay = days[new Date().getDay()];

  // Filter out tasks based on wether the task needs to be done today, marked for later or is done
  const filteredOutTask = tasks.filter((task: TaskProps) => {
    const { type, items, checked, repeatOn } = task;
    const repeatType = typeof repeatOn === "object" ? "daysOfWeek" : "date";

    //check if task is completed
    const completedTask =
      (type === "checked" &&
        typeof checked === "object" &&
        items.length === checked.length) ||
      (type === "steps" && items.length - 1 === checked);

    /*
    Mark for today if - 
    !completed but repeatOnDate <= Today
    !complted but repeatWithDay = todaysDay
    */

    const markForToday =
      !completedTask &&
      ((repeatType === "date" &&
        new Date(typeof repeatOn !== "string" ? "" : repeatOn) <= todaysDate) ||
        repeatOn.includes(todaysDay));

    /*
    Mark for later if - 
    repeatOnDate > Today
    complted but repeatWithDay
    !complted but repeatWithDay not including today
    */

    const markForLater =
      (repeatType === "date" &&
        new Date(typeof repeatOn !== "string" ? "" : repeatOn) > todaysDate) ||
      (completedTask && repeatType === "daysOfWeek") ||
      (!completedTask &&
        repeatType === "daysOfWeek" &&
        !repeatOn.includes(todaysDay));

    /*
    Mark for done if - 
        completed but repeatOnDate <= Today
    */
    const markForDone =
      completedTask &&
      repeatType === "date" &&
      new Date(typeof repeatOn !== "string" ? "" : repeatOn) <= todaysDate;

    switch (tab) {
      case "today":
        {
          if (markForToday) {
            return task;
          }
        }
        break;
      case "later":
        {
          if (markForLater) {
            return task;
          }
        }
        break;
      case "done":
        {
          if (markForDone) {
            return task;
          }
        }
        break;
      default:
        return task;
    }
  });

  return filteredOutTask;
};

export default FilterTaskAsPerCategory;
