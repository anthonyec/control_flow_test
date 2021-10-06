import workflow from './workflow.json';
import ACTIONS from './actions';

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
  const execute = ACTIONS[action.type];

  if (action.flowControl === 'start' || action.flowControl === 'end') {
    const id = action.group;
    const groupedActions = getControlFlowGroup(actions, id);
    const existingGroupProps = getGroupProps(id);

    const { props, controlFlowIndex } = execute({ ...existingGroupProps, ...parameters }, action.flowControl);

    setGroupProps(id, {...parameters, ...props});

    return { props, nextIndex: groupedActions[controlFlowIndex].index + 1 };
  }

  const { props } = execute(parameters);
  const nextIndex = index + 1;

  return { props, nextIndex };
}

const maxIndex = workflow.actions.length - 1;
let currentIndex = 0;
let iterations = 0;

while (iterations < 999 && currentIndex <= maxIndex) {
  const results = runActionAtIndex(workflow.actions, currentIndex);
  currentIndex = results.nextIndex;
  iterations += 1;
}

if (iterations >= 999) {
  console.log('Infinite loop protection!');
}
