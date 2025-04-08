import { DeleteFilled } from "@ant-design/icons";
import axios from "axios";
import { ButtonWithImage } from "ux-component";
import { TaskProps } from "./DisplayTab";

const DisplayTaskHeaders = (
  noDelete = false,
  task: TaskProps,
  handleDelete: (id: string) => void
) => {
  const handleDeleteOFTask = () => {
    axios
      .delete(import.meta.env.VITE_APP_BACKEND_URL + "tasks/" + task["_id"])
      .then(() => handleDelete(task["_id"]))
      .catch((error) => console.log(error));
  };
  return (
    <>
      {(!noDelete && (
        <>
          <ButtonWithImage
            key={task["_id"]}
            onClick={() => handleDeleteOFTask()}
            type="default"
            ImageDisplayed={<DeleteFilled />}
          />
        </>
      )) || <></>}
    </>
  );
};

export default DisplayTaskHeaders;
