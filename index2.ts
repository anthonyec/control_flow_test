import { Log, TextContent, GetElement, ActionParameters, DeleteElement, CreateElement, InsertCSS, RepeatTimes } from './actions2';

import workflow from './workflow_3.json';

interface SerializedAction {
  identifier: string;
  uuid?: string;
  group?: string;
  flowControl?: string;
  parameters?: { [key: string]: any };
}

interface WorkflowFile {
  schema_version: number;
  title: string;
  author: string;
  config: any;
  actions: SerializedAction[];
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

function getActionFromIdentifier(identifier: string) {
  const actions = [Log, TextContent, GetElement, DeleteElement, CreateElement, InsertCSS, RepeatTimes];
  return actions.find((action) => action.identifier === identifier);
}

function getParameterizedInput(
  value: any,
  parametersTemplate: ActionParameters
) {
  const keys = Object.keys(parametersTemplate);
  return { [keys[0]]: value };
}

function getDefaultInputParameter(parametersTemplate?: ActionParameters) {
  const foundParameterKey = Object.keys(parametersTemplate).find(
    (parameterKey) => {
      const parameter = parametersTemplate[parameterKey];
      return parameter.defaultInput;
    }
  );

  return parametersTemplate[foundParameterKey];
}

function replaceWithVariableValues(
  serializedParameters?: SerializedAction['parameters'],
  variableStore: any
) {
  const parametersWithVariables = Object.keys(serializedParameters).reduce(
    (mem, parameterKey) => {
      const parameter = serializedParameters[parameterKey];
      const variableName = parameter.uuid;
      const value = variableName
        ? variableStore.getValue(variableName)
        : parameter;

      mem[parameterKey] = value;

      return mem;
    },
    {}
  );

  return parametersWithVariables;
}

const FAKE_VARIABLE_STORE = {
  storage: {},

  setValue(key, value) {
    this.storage[key] = value;
  },

  getValue(key) {
    return this.storage[key];
  },
};

function runActionAtIndex(
  actions: SerializedAction[],
  index: number,
  input?: any
) {
  const serializedAction = actions[index];
  const serializedParameters = serializedAction.parameters
    // TODO: Move outside this function?
    ? replaceWithVariableValues(
        serializedAction.parameters,
        FAKE_VARIABLE_STORE
      )
    : null;

  const Action = getActionFromIdentifier(serializedAction.identifier);
  const actionInstance = new Action();
  const defaultInput = getDefaultInputParameter(Action.parameters);

  // TODO: BEGIN MESSY FLOW CONTROL.
  if (serializedAction.flowControl) {
    let nextIndex = index + 1;

    actionInstance.setScopedVariable = (name, value) => {
      console.log('serializedAction->set', name, value);
      FAKE_VARIABLE_STORE.setValue(name, value);
    };

    actionInstance.getScopedVariable = (name) => {
      const value = FAKE_VARIABLE_STORE.getValue(name);
      console.log('serializedAction->get', value);
      return value;
    };

    actionInstance.getFlowControlState = () => {
      return serializedAction.flowControl;
    };

    actionInstance.gotoFlowControlIndex = (index) => {
      const groupedActions = getControlFlowGroup(actions, serializedAction.group);
      console.log('serializedAction->gotoFlowControlIndex', index, groupedActions[index].index + 1);
      nextIndex = groupedActions[index].index + 1;
    }

    const output = actionInstance.run({ count: 5 });

    return { output: {}, index: nextIndex };
  }
  // TODO: END MESSY FLOW CONTROl.

  if (!input) {
    const output = actionInstance.run(serializedParameters);
    return { output, index: index + 1 };
  }

  // Only use output from a previous action if the current action accepts input
  // from previous actions using `defaultInput`.
  const parameterizedInput =
    defaultInput && !serializedParameters
      ? getParameterizedInput(input, Action.parameters)
      : serializedParameters;

  const output = actionInstance.run(parameterizedInput);

  return { output, index: index + 1 };
}

const workflowFile = workflow as WorkflowFile;

function createActionsIterator(actions: SerializedAction[]) {
  let index = 0;
  let iterationOutput = null;

  return () => {
    if (index > actions.length - 1) {
      throw new Error('end');
    }

    const variableUUID = actions[index].uuid;
    const results = runActionAtIndex(actions, index, iterationOutput);

    console.log('results', results);

    if (variableUUID) {
      FAKE_VARIABLE_STORE.setValue(variableUUID, results.output);
    }

    iterationOutput = results.output;
    index += 1;
  };
}

const next = createActionsIterator(workflowFile.actions);

const interval = setInterval(() => {
  try {
    next();
  } catch (err) {
    console.log(err);
    clearInterval(interval);
  }
});
