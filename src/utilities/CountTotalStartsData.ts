import { TaskProps } from "../components/DisplayTab";

const CountTotalStartsData = (tasks: TaskProps[]) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Today's date needed if task needs to be done today
  const todaysDate = new Date();

  const starStatistics = [...Array(6).keys()].slice(1).map((start) => ({
    urgency: start,
    done: 0,
    total: 0,
  }));

  //Today's day
  const todaysDay = days[new Date().getDay()];

  tasks.forEach((task) => {
    const { type, items, checked, repeatOn, imp } = task;
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

    if (completedTask) {
      starStatistics[imp - 1]["done"] += 1;
      starStatistics[imp - 1]["total"] += 1;
    }
    if (markForToday) {
      starStatistics[imp - 1]["total"] += 1;
    }
  });
  return starStatistics.reverse();
};

export default CountTotalStartsData;
