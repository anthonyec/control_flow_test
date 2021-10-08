import {
  Log,
  TextContent,
  GetElement,
  ActionParameters
} from './actions2';

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
  return actions.find(action => action.identifier === identifier);
}

function getParameterizedInput(value: any, parametersTemplate: ActionParameters) {
  const keys = Object.keys(parametersTemplate);
  return { [keys[0]]: value };
}

function getDefaultInputParameter(parametersTemplate?: ActionParameters) {
  const foundParameterKey = Object.keys(parametersTemplate).find((parameterKey) => {
    const parameter = parametersTemplate[parameterKey];
    return parameter.defaultInput;
  });

  return parametersTemplate[foundParameterKey];
}

function runActionAtIndex(actions: SerializedAction[], index: number, input?: any) {
  const serializedAction = actions[index];
  const Action = getActionFromIdentifier(serializedAction.identifier);

  const actionInstance = new Action();

  const defaultInput = getDefaultInputParameter(Action.parameters);

  if (!input) {
    const output = actionInstance.run(serializedAction.parameters);
    return output;
  }

  // Only use output from a previous action if the current action accepts input
  // from previous actions using `defaultInput`.
  const parameterizedInput = defaultInput && !serializedAction.parameters ?
    getParameterizedInput(input, Action.parameters) :
    serializedAction.parameters;

  const output = actionInstance.run(parameterizedInput);

  return output;
}

const workflowFile = workflow as WorkflowFile;

const iterationOutput1 = runActionAtIndex(workflowFile.actions, 0);
const iterationOutput2 = runActionAtIndex(workflowFile.actions, 1, iterationOutput1);
const iterationOutput3 = runActionAtIndex(workflowFile.actions, 2, iterationOutput2);
const iterationOutput4 = runActionAtIndex(workflowFile.actions, 3, iterationOutput3);

// console.log(iterationOutput4);
