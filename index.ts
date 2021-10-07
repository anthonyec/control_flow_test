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
const VARIABLE_STORE = {}

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

function setVariable(uuid, value) {
  VARIABLE_STORE[uuid] = value;
}

function getVariable(uuid) {
  return VARIABLE_STORE[uuid];
}

function populateVariables(store = {}, parameters = {}) {
  return Object.keys(parameters).reduce((mem, parameter) => {
    const value = parameters[parameter];

    if (typeof value === 'object' && 'uuidOutput' in value) {
      mem[parameter] = store[value.uuidOutput];
    } else if (typeof value === 'object' && 'uuidOutputUsingRange' in value) {
      const variableValue = store[value.uuidOutputUsingRange.uuid];
      mem[parameter] = value.uuidOutputUsingRange.string.replace('%', variableValue);
    } else {
      mem[parameter] = value;
    }

    return mem;
  }, {});
}

function getActionsWithLevels(actions = []) {
  let actionsWithLevels = [];
  let groups = [];

  actions.forEach((action) => {
    if ('group' in action) {
      const index = groups.indexOf(action.group);

      if (index === -1) {
        groups.push(action.group);
      } else {
        groups.splice(index);
      }
    }

    const newActions = {
      ...action,
      level: groups.length
    };

    actionsWithLevels.push(newActions);
  });

  return actionsWithLevels;
}

function runActionAtIndex(actions = [], index: number) {
  const actionsWithLevel = getActionsWithLevels(actions);
  const action = actionsWithLevel[index];
  const parameters = populateVariables(VARIABLE_STORE, action.parameters);
  const execute = ACTIONS[action.type];

  if (action.flowControl === 'start' || action.flowControl === 'end') {
    const id = action.group;
    const groupedActions = getControlFlowGroup(actions, id);
    const existingGroupProps = getGroupProps(id);

    const { props, controlFlowIndex } = execute({ ...existingGroupProps, ...parameters }, action.flowControl);

    setGroupProps(id, {...parameters, ...props});

    return { props, nextIndex: groupedActions[controlFlowIndex].index + 1 };
  }

  const { props, output } = execute(parameters);
  const nextIndex = index + 1;

  if (action.uuid && output) {
    setVariable(action.uuid, output.value);
  }

  return { props, output, nextIndex };
}

function runActions(actions = []) {
  const maxIterations = 999;

  let iterations = 0;
  let currentIndex = 0;
  let speed = 0;

  function run() {
    if (iterations > maxIterations / 2) {
      speed = 50;
    }

    if (iterations > maxIterations) {
      console.log('infinite loop protection!');
      return;
    }

    if (currentIndex > actions.length - 1) {
      console.log('finished');
      return;
    }

    const results = runActionAtIndex(actions, currentIndex);
    currentIndex = results.nextIndex;
    iterations += 1;

    setTimeout(run, speed);
  }

  run();
}

runActions(workflow.actions);
