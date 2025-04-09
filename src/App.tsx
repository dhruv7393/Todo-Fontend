import "./App.css";
import DisplayStreakCount from "./components/DisplayStreakCount";
import DisplayTab from "./components/DisplayTab";
import { notification } from "antd";

type NotificationType = "success" | "info" | "warning" | "error";

export interface openNotificationWithIconProps {
  openNotificationWithIcon: (
    type: NotificationType,
    message: string,
    description: string
  ) => void;
}

function App() {
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = (
    type: NotificationType,
    message: string,
    description: string
  ) => {
    api[type]({
      message: message,
      description: description,
    });
  };
  return (
    <>
      {contextHolder}
      <DisplayStreakCount openNotificationWithIcon={openNotificationWithIcon} />
      <DisplayTab openNotificationWithIcon={openNotificationWithIcon} />
    </>
  );
}

export default App;
