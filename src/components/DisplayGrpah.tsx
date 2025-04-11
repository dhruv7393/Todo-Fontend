import { StarFilled } from "@ant-design/icons";
import { Col, Divider, Row } from "antd";
import { GaugeCreator, StatisticCreator } from "ux-component";

export interface starsCompleted {
  done: number;
  total: number;
  urgency: number;
}

export interface DisplayGrpahProps {
  starStatistics: starsCompleted[];
}

const DisplayGrpah = ({ starStatistics }: DisplayGrpahProps) => {
  const stepsToSuccess: string[] = [
    "Techie",
    "FIRE",
    "Project Happy",
    "Read To Grow",
    "6 Pack Abs",
    "Goon",
    "Thank You",
    "Introspect",
    "Hu To Ayvo",
  ];

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
        {(stepsToSuccess.length &&
          stepsToSuccess.map((success) => {
            return (
              <Col span={12}>
                <div
                  style={{
                    border: "1px solid rgba(0, 0, 0, 0.45)",
                    margin: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <StatisticCreator title={success} value="-30" />
                </div>
              </Col>
            );
          })) || <></>}
      </Row>
    </>
  );
};

export default DisplayGrpah;
