import {
  Log,
  TextContent,
  GetElement,
  ActionParameters,
  DeleteElement,
  CreateElement,
  InsertCSS,
  RepeatTimes,
  Conditional,
  Popup
} from './actions2';

import workflow from './workflow_2.json';

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
  return actions
    .map((action, index) => {
      return {
        index,
        ...action,
      };
    })
    .filter((action) => {
      return action.group === id;
    });
}

function getActionFromIdentifier(identifier: string) {
  const actions = [
    Log,
    TextContent,
    GetElement,
    DeleteElement,
    CreateElement,
    InsertCSS,
    RepeatTimes,
    Conditional,
    Popup
  ];
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

function getDefaultParameters(parametersTemplate?: ActionParameters) {
  Object.keys(parametersTemplate).reduce((mem, key) => {
    const parameter = parametersTemplate[key];

    mem[key] = parameter.defaultValue ? parameter.defaultValue : null;

    return mem;
  }, {});
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
    ? // TODO: Move outside this function?
      replaceWithVariableValues(
        serializedAction.parameters,
        FAKE_VARIABLE_STORE
      )
    : null;

  const Action = getActionFromIdentifier(serializedAction.identifier);
  const actionInstance = new Action();
  const defaultInput = getDefaultInputParameter(Action.parameters);
  const defaultParameters = getDefaultParameters(Action.parameters);

  // Only use output from a previous action if the current action accepts input
  // from previous actions using `defaultInput`.
  const parameterizedInput =
    defaultInput && !serializedParameters
      ? getParameterizedInput(input, Action.parameters)
      : {};

  const output = actionInstance.run({
    ...defaultParameters,
    ...serializedParameters,
    ...parameterizedInput,
  });

  return { output, index: index + 1 };
}

const workflowFile = workflow as WorkflowFile;

function createActionsIterator(actions: SerializedAction[]) {
  let index = 0;
  let iterations = 0;
  let iterationOutput = null;
  return () => {
    if (index > actions.length - 1) {
      throw new Error('end');
    }

    if (iterations > 100) {
      throw new Error('infinite loop');
    }

    const variableUUID = actions[index].uuid;
    const results = runActionAtIndex(actions, index, iterationOutput);

    if (variableUUID) {
      FAKE_VARIABLE_STORE.setValue(variableUUID, results.output);
    }

    iterationOutput = results.output;
    index = results.index;
    iterations += 1;
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
