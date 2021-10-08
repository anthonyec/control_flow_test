enum ActionParameterType {
  String = 'string',
  DOMElement = 'DOMElement',
  Number = 'DOMElement',
}

export interface ActionParameters {
  [key: string]: {
    type: ActionParameterType,
    defaultInput?: boolean;
    defaultValue?: any;
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

  run({ type, className, id, text = '' }) {
    const element = document.createElement('div');

    if (className) {
      element.classList.add(className);
    }

    if (id) {
      element.id = id;
    }

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

  run({ css = '' }) {
    const element = document.createElement('style');
    element.innerHTML = css;
    window.document.body.appendChild(element);
    return null;
  }
}

export class Log {
  static identifier = "log";
  static title = "Log";
  static parameters = {
    message: { type: ActionParameterType.String, defaultInput: true }
  }
  static output = null

  run({ message = '' }) {
    console.log('LOG:', `"${message}"`);
    return null;
  }
}

export class Popup {
  static identifier = "popup";
  static title = "Popup";
  static parameters = {
    url: { type: ActionParameterType.String, defaultInput: true },
    width: { type: ActionParameterType.Number },
    height: { type: ActionParameterType.Number },
    top: { type: ActionParameterType.Number },
    left: { type: ActionParameterType.Number }
  }
  static output = null

  run({ url = '', width = 500, height = 400, top = 100, left = 100 }) {
    window.open(url, 'popup', `width=${width},height=${height},top=${top},left=${left}`);
    return null;
  }
}

// class FlowControlAction {
//   gotoFlowControlIndex(index: number) {
//     console.log('gotoFlowControlIndex', index);
//   }

//   getFlowControlState() {
//     console.log('getFlowControlState');
//   }

//   setScopedVariable(name, value) {
//     console.log('setScopedVariable');
//   }

//   getScopedVariable<T>(name, defaultValue): T  {
//     console.log('getScopedVariable');
//     return;
//   }
// }

// export class RepeatTimes extends FlowControlAction {
//   static identifier = "repeat_times";
//   static title = "Repeat Times";
//   static parameters = {
//     count: { type: ActionParameterType.Number },
//   }

//   run({ count }) {
//     const flowControlState = this.getFlowControlState();

//     console.log('REPEAT_TIMES', flowControlState);

//     if (flowControlState === 'start') {
//       return this.setScopedVariable('currentIndex', 0);
//     }

//     if (flowControlState === 'end') {
//       const currentIndex = this.getScopedVariable<number>('currentIndex');

//       console.log('currentIndex', currentIndex);

//       if (currentIndex < count) {
//         this.gotoFlowControlIndex(0);
//       } else {
//         this.gotoFlowControlIndex(1);
//       }

//       this.setScopedVariable('currentIndex', currentIndex + 1);
//     }
//   }
// }

export class Conditional {
  static identifier = "conditional";
  static title = "Conditional";
  static parameters = {
    a: { type: ActionParameterType.String, defaultInput: true },
    b: { type: ActionParameterType.String },
    comparator: { type: ActionParameterType.String }
  }

  run({ a, b, comparator }) {
    if (comparator === '>') {
      return a > b;
    }

    if (comparator === '<') {
      return a < b;
    }

    if (comparator === '<=') {
      return a <= b;
    }

    if (comparator === '>=') {
      return a >= b;
    }

    if (comparator === '=') {
      return a === b;
    }

    if (comparator === 'contains') {
      return a.includes(b);
    }

    if (comparator === 'doesNotContain') {
      return !a.includes(b);
    }
  }
}

export class RepeatTimes {
  static identifier = "repeat_times";
  static title = "Repeat Times";
  static parameters = {
    count: { type: ActionParameterType.Number },
  }

  run({ count }) {
    console.log('REPEAT_TIMES', count);
  }

  getFlowControlIndex(state: string, { count }) {
    if (state === 'start') {
      return 0;
    }

    if (state === 'end') {
      return 0;
      // return this.getScopedVariable('currentIndex') < count ? 0 : 1;
    }
  }
}
