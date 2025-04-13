import { StarFilled } from "@ant-design/icons";
import { Col, Divider, Row } from "antd";
import { GaugeCreator, StatisticCreator } from "ux-component";

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
}

const DisplayGrpah = ({
  starStatistics,
  activeDays,
  weekDays,
  sincerity,
}: DisplayGrpahProps) => {
  const nityaSuccess: string[] = [
    "Goon",
    "Thank You",
    "Introspection",
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
                      borderRadius: "10px",
                    }}
                  >
                    <StatisticCreator
                      title={success.title}
                      value={success.value}
                      of={success.of}
                    />
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
