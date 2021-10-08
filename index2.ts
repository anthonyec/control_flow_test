import { Log, TextContent, GetElement, ActionParameters } from './actions2';

import workflow from './workflow_2.json';

interface SerializedAction {
  identifier: string;
  parameters?: { [key: string]: any };
}

interface WorkflowFile {
  schema_version: number;
  title: string;
  author: string;
  config: any;
  actions: SerializedAction[];
}

function getActionFromIdentifier(identifier: string) {
  const actions = [Log, TextContent, GetElement];
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

  console.log('parametersWithVariables', parametersWithVariables);

  return parametersWithVariables;
}

const FAKE_VARIABLE_STORE = {
  getValue(key) {
    return 'VARIABLE';
  },
};

function runActionAtIndex(
  actions: SerializedAction[],
  index: number,
  input?: any
) {
  const serializedAction = actions[index];
  const serializedParameters = serializedAction.parameters
    ? replaceWithVariableValues(
        serializedAction.parameters,
        FAKE_VARIABLE_STORE
      )
    : null;

  const Action = getActionFromIdentifier(serializedAction.identifier);
  const actionInstance = new Action();
  const defaultInput = getDefaultInputParameter(Action.parameters);

  if (!input) {
    const output = actionInstance.run(serializedParameters);
    return output;
  }

  // Only use output from a previous action if the current action accepts input
  // from previous actions using `defaultInput`.
  const parameterizedInput =
    defaultInput && !serializedParameters
      ? getParameterizedInput(input, Action.parameters)
      : serializedParameters;

  const output = actionInstance.run(parameterizedInput);

  return output;
}

const workflowFile = workflow as WorkflowFile;

function createActionsIterator(actions: SerializedAction[]) {
  let index = 0;
  let iterationOutput = null;

  return () => {
    if (index > actions.length - 1) {
      throw new Error('end');
    }

    iterationOutput = runActionAtIndex(actions, index, iterationOutput);
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
