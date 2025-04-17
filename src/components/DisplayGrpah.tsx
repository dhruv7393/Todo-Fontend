import { PlusCircleFilled, StarFilled } from "@ant-design/icons";
import { Col, Divider, Row } from "antd";
import axios from "axios";
import { useState } from "react";
import { ButtonWithImage, GaugeCreator, StatisticCreator } from "ux-component";
import { openNotificationWithIconProps } from "../App";

export interface starsCompleted {
  done: number;
  total: number;
  urgency: number;
}

interface sincerityProp {
  Goon: number;
  "6 Pack Abs": number;
  FIRE: number;
  "Hu To Ayvo": number;
  Introspection: number;
  "Project Happy": number;
  "Read To Grow": number;
  Techie: number;
  "Thank You": number;
}

export interface DisplayGrpahProps {
  starStatistics: starsCompleted[];
  activeDays: number;
  weekDays: number;
  sincerity: sincerityProp;
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"];
}

const DisplayGrpah = ({
  starStatistics,
  activeDays,
  weekDays,
  sincerity: sincerityFromAPI,
  openNotificationWithIcon,
}: DisplayGrpahProps) => {
  const [sincerity, updateSincerity] = useState(sincerityFromAPI);

  const updateSincerityCount = (taskName: string) => {
    const config = {
      method: "post",
      url: import.meta.env.VITE_APP_BACKEND_URL + "streakcount/" + taskName,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(({ data }) => {
        openNotificationWithIcon("success", taskName + " has been updated", "");
        updateSincerity((task) => {
          return { ...task, ...data[0].sincerity };
        });
      })
      .catch(() => {
        openNotificationWithIcon(
          "error",
          "Damm..",
          "Task could not be updated"
        );
      });
  };
  const nityaSuccess: string[] = [
    "Goon",
    "Thank You",
    "Introspection",
    "Dhun",
    "Hu To Ayvo",
  ];
  const weekDaySuccess: string[] = [
    "Techie",
    "FIRE",
    "Project Happy",
    "Read To Grow",
    "6 Pack Abs",
  ];

  const checkValueInSincerity = (success: string): number => {
    const sincerityKeys: string[] = Object.keys(sincerity);
    const sincerityValues: number[] = Object.values(sincerity);
    return sincerityKeys.includes(success)
      ? sincerityValues[sincerityKeys.indexOf(success)]
      : 0;
  };

  const successValuesToBeDisplayed: {
    title: string;
    value: string;
    of: string;
  }[] = [];
  nityaSuccess.forEach((success) => {
    successValuesToBeDisplayed.push({
      title: success,
      value: (activeDays - checkValueInSincerity(success)).toString(),
      of: activeDays.toString(),
    });
  });

  weekDaySuccess.forEach((success) => {
    successValuesToBeDisplayed.push({
      title: success,
      value: (weekDays - checkValueInSincerity(success)).toString(),
      of: weekDays.toString(),
    });
  });

  const processingStarData = () => {
    return starStatistics
      .filter((star) => star.total > 0)
      .map((starData) => {
        const { done, total, urgency } = starData;
        return {
          title: total - done + " of " + total + " pending",
          percent: (done * 100) / total,
          size: 80,
          format: (
            <>
              {urgency} <StarFilled style={{ color: "#fadb14" }} />
            </>
          ),
        };
      });
  };

  const startDataToBeShown = processingStarData();

  return (
    <>
      <GaugeCreator progesses={startDataToBeShown} />
      <Divider />
      <Row>
        {(successValuesToBeDisplayed.length &&
          successValuesToBeDisplayed.map((success) => {
            if (parseInt(success.value) > 1) {
              return (
                <Col span={12}>
                  <div
                    style={{
                      border: "1px solid rgba(0, 0, 0, 0.45)",
                      margin: "10px",
                      paddingBottom: "10px",
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <StatisticCreator
                      title={success.title}
                      value={success.value}
                      of={success.of}
                    />

                    <div style={{ margin: "auto", display: "block" }}>
                      <ButtonWithImage
                        key={success.title}
                        onClick={() => {
                          updateSincerityCount(success.title);
                        }}
                        type={"text"}
                        ImageDisplayed={
                          <PlusCircleFilled style={{ color: "#ff7a45" }} />
                        }
                      />
                    </div>
                  </div>
                </Col>
              );
            }
            return <></>;
          })) || <></>}
      </Row>
    </>
  );
};

export default DisplayGrpah;
