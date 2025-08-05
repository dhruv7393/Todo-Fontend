export interface Task {
  _id: string;
  taskName: string;
  isDone: boolean;
  carryOutOn: string;
  dateOfCarryOut: string;
  canBeReseted: boolean;
  listOfSubTasks: string[];
}
