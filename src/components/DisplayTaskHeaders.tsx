import { DeleteFilled } from "@ant-design/icons";
import axios from "axios";
import { ButtonWithImage } from "ux-component";

const DisplayTaskHeaders = (noDelete = false, task, handleDelete) => {
  const handleDeleteOFTask = () => {
    axios
      .delete("http://localhost:3001/api/tasks/" + task["_id"])
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
