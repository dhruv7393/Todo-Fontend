import { DeleteFilled } from "@ant-design/icons";
import axios from "axios";
import { ButtonWithImage, ModalCreator } from "ux-component";
import { TaskProps } from "./DisplayTab";
import { openNotificationWithIconProps } from "../App";

const DisplayTaskHeaders = (
  noDelete = false,
  task: TaskProps,
  handleDelete: (id: string) => void,
  openNotificationWithIcon: openNotificationWithIconProps["openNotificationWithIcon"]
) => {
  const handleDeleteOFTask = () => {
    axios
      .delete(import.meta.env.VITE_APP_BACKEND_URL + "tasks/" + task["_id"])
      .then(() => {
        openNotificationWithIcon(
          "success",
          task.label + " has been deleted",
          ""
        );
        handleDelete(task["_id"]);
      })
      .catch(() =>
        openNotificationWithIcon(
          "error",
          task.label + " could not be deleted",
          "Please try again!"
        )
      );
  };
  return (
    <>
      {(!noDelete && (
        <>
          <ModalCreator
            button={
              <ButtonWithImage
                key={task["_id"]}
                onClick={() => {}}
                type="default"
                ImageDisplayed={<DeleteFilled />}
              />
            }
            header={"Damm..."}
            message={<>Do you want to delete {<b>{task.label}</b>} ?</>}
            onOK={() => handleDeleteOFTask()}
            onCancel={() => {}}
          />
        </>
      )) || <></>}
    </>
  );
};

export default DisplayTaskHeaders;
