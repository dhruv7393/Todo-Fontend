import { StatisticCreator } from "ux-component";
import countValues from "../mock/StreakCount.json";

const DisplayStreakCount = () => {
  return (
    <>
      <StatisticCreator
        title="Streak Days"
        value={countValues.activeDays}
        of={countValues.totalDays}
      />
    </>
  );
};

export default DisplayStreakCount;
