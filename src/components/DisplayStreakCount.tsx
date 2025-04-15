import { StatisticCreator } from "ux-component";

interface DisplayStreakCountProps {
  weekDays: string;
  activeDays: string;
}

const DisplayStreakCount = ({
  weekDays,
  activeDays,
}: DisplayStreakCountProps) => {
  return (
    <>
      <StatisticCreator title="Streak Days" value={weekDays} of={activeDays} />
    </>
  );
};

export default DisplayStreakCount;
