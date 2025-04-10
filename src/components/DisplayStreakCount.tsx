import { StatisticCreator } from "ux-component";
import countValues from "../mock/StreakCount.json";
import axios from "axios";
import { useEffect, useState } from "react";
import { openNotificationWithIconProps } from "../App";
import { useLocalMock } from "../utilities/mock";

const DisplayStreakCount = ({
  openNotificationWithIcon,
}: openNotificationWithIconProps) => {
  const [activeDays, setActiveDays] = useState("0");
  const [totalDays, setTotalDays] = useState("0");
  useEffect(() => {
    if (!useLocalMock) {
      const config = {
        method: "get",
        url: import.meta.env.VITE_APP_BACKEND_URL + "streakcount",
        headers: {},
      };
      axios(config)
        .then(({ data }) => {
          //axios
          setActiveDays(() => data[0].activeDays);
          setTotalDays(() => data[0].totalDays);
        })
        .catch(() => {
          openNotificationWithIcon(
            "error",
            "Streak data could not be loaded",
            "Please refresh the page"
          );
        });
    } else {
      setActiveDays(() => countValues.activeDays);
      setTotalDays(() => countValues.totalDays);
    }
  });
  return (
    <>
      <StatisticCreator title="Streak Days" value={activeDays} of={totalDays} />
    </>
  );
};

export default DisplayStreakCount;
