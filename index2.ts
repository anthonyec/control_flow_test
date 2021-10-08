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
  flowControlGroup?: string;
  flowControl?: string;
  parameters?: { [key: string]: any };
  runtime?: { index: number; scope: number; }
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

function getDefaultInputParameter(parametersTemplate?: ActionParameters) {
  const foundParameterKey = Object.keys(parametersTemplate).find(
    (parameterKey) => {
      const parameter = parametersTemplate[parameterKey];
      return parameter.defaultInput;
    }
  );

  return { name: foundParameterKey, ...parametersTemplate[foundParameterKey] };
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
      const variableName = parameter?.uuid;
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

  setValue(key, value, scope = 0) {
    this.storage[key] = { value, scope };
  },

  getValue(key, scope = 0) {
    return this.storage[key].value;
  },
};

function withVariables(parameters: object) {
  return replaceWithVariableValues(parameters, FAKE_VARIABLE_STORE);
}

// TODO: May not be needed?
function withRuntimeMetaData(actions: SerializedAction[]) {
  let groups = [];

  return actions.map((action, index) => {
    if ('flowControlGroup' in action) {
      const index = groups.indexOf(action.flowControlGroup);

      if (index === -1) {
        groups.push(action.flowControlGroup);
      } else {
        groups.splice(index);
      }
    }

    return {
      ...action,
      runtime: { index, scope: groups.length }
    };
  });
}

function runActionAtIndex(
  actions: SerializedAction[],
  index: number,
  input?: any
) {
  const serializedAction = actions[index];
  const serializedParameters = serializedAction.parameters;

  const Action = getActionFromIdentifier(serializedAction.identifier);
  const actionInstance = new Action();
  const defaultInput = getDefaultInputParameter(Action.parameters);

  // TODO: Rename? Confusing with default input.
  const defaultParameters = getDefaultParameters(Action.parameters);

  // Only use output from a previous action if the current action accepts input
  // from previous actions using `defaultInput`.
  const shouldUseInput = defaultInput && !serializedParameters;
  const inputWithDefaultParameterName = shouldUseInput ?
    { [defaultInput.name]: input } :
    {};

  const runParameters = withVariables({
    ...defaultParameters,
    ...serializedParameters,
    ...inputWithDefaultParameterName,
  });

  const output = actionInstance.run(runParameters);

  return { output, index: index + 1 };
}

const workflowFile = workflow as WorkflowFile;

function createActionsIterator(actions: SerializedAction[]) {
  let index = 0;
  let iterations = 0;
  let iterationOutput = null;

  return () => {
    if (index > actions.length - 1) {
      return null;
    }

    if (iterations > 100) {
      throw new Error('infinite loop');
    }

    const currentAction = actions[index];
    const variableUUID = currentAction.uuid;
    const results = runActionAtIndex(actions, index, iterationOutput);

    if (variableUUID) {
      FAKE_VARIABLE_STORE.setValue(variableUUID, results.output, actions[index].runtime.scope);
    }

    iterationOutput = results.output;
    index = results.index;
    iterations += 1;

    return { id: currentAction.identifier, index, scope: currentAction.runtime.scope, output: iterationOutput };
  };
}

const actionsMetaData = withRuntimeMetaData(workflowFile.actions);
const next = createActionsIterator(actionsMetaData);

let debugInfo = [];

const interval = setInterval(() => {
  try {
    const iterationInfo = next();

    if (!iterationInfo) {
      console.log('Finished');
      console.table(debugInfo);
      clearInterval(interval);
    }

    debugInfo.push(iterationInfo);
  } catch (err) {
    console.log(err);
    console.table(debugInfo);
    clearInterval(interval);
  }
});
