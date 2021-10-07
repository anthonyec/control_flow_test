function result(output, additional?) {
  return { output, ...additional };
}

function continueAfter(index) {
  return {
    controlFlowGoto: index
  }
}

interface LogInput {
  message: string;
}

export class Log {
  run(input: LogInput) {
    console.log(input.message);
    return result(input);
  }
}


interface WaitInput {
  seconds: number;
}

export class Wait {
  run(input: WaitInput) {
    return () => {
      setTimeout(() => {
        return result(input);
      }, seconds * 1000);
    }
  }
}

interface RepeatTimesInput {
  count: number;
}

class Action {
  state = {};

  setState(newState: any) {
    console.log('setState', newState);
    this.state = { ...this.state, ...newState }
  }
}

export class RepeatTimes extends Action {
  runStart(input: RepeatTimesInput) {
    this.setState({
      currentIndex: 0
    });

    return result(input, continueAfter(0));
  }

  runEnd(input: RepeatTimesInput) {
    if (this.state.currentIndex < input.count - 1) {
      this.setState({
        currentIndex: currentIndex + 1
      });

      return result(input, continueAfter(0));
    }

    return result(input, continueAfter(1));
  }
}
