import { StatisticCreator } from "ux-component";

interface DisplayStreakCountProps {
  activeDays: string;
  totalDays: string;
}

const DisplayStreakCount = ({
  activeDays,
  totalDays,
}: DisplayStreakCountProps) => {
  return (
    <>
      <StatisticCreator title="Streak Days" value={activeDays} of={totalDays} />
    </>
  );
};

export default DisplayStreakCount;
