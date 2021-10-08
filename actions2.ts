enum ActionParameterType {
  String = 'string',
  DOMElement = 'DOMElement'
}

export interface ActionParameters {
  [key: string]: {
    type: ActionParameterType,
    defaultInput?: boolean;
  };
}

interface Action {
  identifier: string;
  title: string;
  parameters: ActionParameters;
}

export class GetElement {
  static identifier = "get_element";
  static title = "Get Element";
  static parameters = {
    selector: { type: ActionParameterType.DOMElement }
  }
  static output = { type: 'DOMElement', name: 'Element' }

  run({ selector = '' }) {
    const element = document.querySelector(selector);
    return element;
  }
}

export class TextContent {
  static identifier = "text_content";
  static title = "Text";
  static parameters = {
    text: { type: ActionParameterType.String }
  }
  static output = { type: 'string ', name: 'Text' }

  run({ text }) {
    return text;
  }
}

export class Log {
  static identifier = "log";
  static title = "Log";
  static parameters = {
    message: { type: ActionParameterType.String, defaultInput: true }
  }
  static output = null

  run({ message = 'default message' }) {
    console.log('LOG:', message);
    return null;
  }
}


