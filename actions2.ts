enum ActionParameterType {
  String = 'string',
  DOMElement = 'DOMElement',
  Number = 'DOMElement'
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
    try {
      const element = document.querySelector(selector);
      return element;
    } catch (err) {
      console.log('GetElement->Error', err);
      return null;
    }
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

export class DeleteElement {
  static identifier = "delete_element";
  static title = "Delete Element";
  static parameters = {
    element: { type: ActionParameterType.DOMElement, defaultInput: true }
  }
  static output = null

  run({ element }) {
    element.remove()
  }
}

export class CreateElement {
  static identifier = "create_element";
  static title = "Create Element";
  static parameters = {
    parent: { type: ActionParameterType.DOMElement, defaultValue: window.document.body },
    type: { type: ActionParameterType.String, defaultValue: 'div' },
    className: { type: ActionParameterType.String },
    id: { type: ActionParameterType.String },
    text: { type: ActionParameterType.String, defaultInput: true }
  }
  static output = { type: 'DOMElement', name: 'Element' }

  run({ className, id, text, type }) {
    console.log('CreateElement');

    const element = document.createElement('div');

    element.classList.add(className);
    element.id = id;
    element.textContent = text;

    window.document.body.appendChild(element);

    return element;
  }
}

export class InsertCSS {
  static identifier = "insert_css";
  static title = "Insert CSS";
  static parameters = {
    css: { type: ActionParameterType.String },
  }

  run({ css }) {
    const element = document.createElement('style');
    element.innerHTML = css;
    window.document.body.appendChild(element);

    return element;
  }
}

export class Log {
  static identifier = "log";
  static title = "Log";
  static parameters = {
    message: { type: ActionParameterType.String, defaultInput: true }
  }
  static output = null

  run({ message }) {
    // TODO: Handle default input when message does not exist.
    console.log('LOG:', message);
    return null;
  }
}

class FlowControlAction {
  gotoFlowControlIndex(index: number) {
    console.log('gotoFlowControlIndex', index);
  }

  getFlowControlState() {
    console.log('getFlowControlState');
  }

  setScopedVariable(name, value) {
    console.log('setScopedVariable');
  }

  getScopedVariable<T>(name, defaultValue): T  {
    console.log('getScopedVariable');
    return;
  }
}

export class RepeatTimes extends FlowControlAction {
  static identifier = "repeat_times";
  static title = "Repeat Times";
  static parameters = {
    count: { type: ActionParameterType.Number },
  }

  run({ count }) {
    const flowControlState = this.getFlowControlState();

    console.log('REPEAT_TIMES', flowControlState);

    if (flowControlState === 'start') {
      return this.setScopedVariable('currentIndex', 0);
    }

    if (flowControlState === 'end') {
      const currentIndex = this.getScopedVariable<number>('currentIndex');

      console.log('currentIndex', currentIndex);

      if (currentIndex < count) {
        this.gotoFlowControlIndex(0);
      } else {
        this.gotoFlowControlIndex(1);
      }

      this.setScopedVariable('currentIndex', currentIndex + 1);
    }
  }
}
