import { StarOutlined } from "@ant-design/icons";
import { Divider } from "antd";
import { GaugeCreator } from "ux-component";
import { GaugeCreatorProps } from "ux-component/src/component/GaugeCreator";

const DisplayGrpah = () => {
  const processes: GaugeCreatorProps["progesses"] = [
    {
      title: "70 of 100 pending",
      percent: 30,
      size: 80,
      format: (
        <>
          4 <StarOutlined />
        </>
      ),
    },
    {
      title: "70 of 100 pending",
      percent: 30,
      size: 80,
      format: (
        <>
          3 <StarOutlined />
        </>
      ),
    },

    {
      title: "70 of 100 pending",
      percent: 30,
      size: 80,
      format: (
        <>
          2 <StarOutlined />
        </>
      ),
    },

    {
      title: "70 of 100 pending",
      percent: 30,
      size: 80,
      format: (
        <>
          1 <StarOutlined />
        </>
      ),
    },
  ];

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

  const successGauge: GaugeCreatorProps["progesses"] = stepsToSuccess.map(
    (success) => {
      return {
        title: "70 of 100 pending",
        percent: 30,
        size: 100,
        format: <>{success}</>,
      };
    }
  );

  return (
    <>
      <GaugeCreator progesses={processes} showGrid={true} colspan={6} />
      <Divider />
      <GaugeCreator progesses={successGauge} />
    </>
  );
};

export default DisplayGrpah;
