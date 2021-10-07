import workflow from './workflow.json';
import { RepeatTimes, Log } from './action';

const ACTIONS = {
  repeat_times: RepeatTimes,
  log: Log
}

function getControlFlowGroup(actions: any, id: string) {
  return actions.map((action, index) => {
    return {
      index,
      ...action
    }
  }).filter((action) => {
    return action.group === id;
  });
}

const GROUP_PROPS = {};

function getGroupProps(id) {
  if (GROUP_PROPS[id]) {
    return GROUP_PROPS[id];
  };

  return {};
}

function setGroupProps(id, props) {
  GROUP_PROPS[id] = {
    ...GROUP_PROPS[id],
    ...props
  };
}

function runActionAtIndex(actions = [], index: number) {
  const action = actions[index];
  const parameters = action.parameters;
  const ActionClass = ACTIONS[action.type];

  console.log(action, ActionClass);

  const actionInstance = new ActionClass();

  if (action.flowControl === 'start' || action.flowControl === 'end') {
    const id = action.group;
    const groupedActions = getControlFlowGroup(actions, id);

    const resultsFromRun = action.flowControl === 'start' ?
      actionInstance.runStart(parameters) :
      actionInstance.runEnd(parameters);

    const nextIndex = groupedActions[resultsFromRun.controlFlowGoto].index + 1;

    console.log(resultsFromRun, nextIndex);

    return { props: {}, nextIndex };
  }

  const resultsFromRun = actionInstance.run(parameters);
  const nextIndex = index + 1;

  console.log(resultsFromRun);

  return { props: {}, nextIndex };


  // if (action.flowControl === 'start' || action.flowControl === 'end') {
  //   const id = action.group;
  //   const groupedActions = getControlFlowGroup(actions, id);
  //   const existingGroupProps = getGroupProps(id);

  //   const { props, controlFlowIndex } = execute({ ...existingGroupProps, ...parameters }, action.flowControl);

  //   setGroupProps(id, {...parameters, ...props});

  //   return { props, nextIndex: groupedActions[controlFlowIndex].index + 1 };
  // }

  // const { props } = execute(parameters);
  // const nextIndex = index + 1;

  // return { props, nextIndex };
}

const maxIndex = workflow.actions.length - 1;
let currentIndex = 0;
let iterations = 0;

while (iterations < 100 && currentIndex <= maxIndex) {
  const results = runActionAtIndex(workflow.actions, currentIndex);
  currentIndex = results.nextIndex;
  iterations += 1;
}

if (iterations >= 100) {
  console.log('Infinite loop protection!');
}
