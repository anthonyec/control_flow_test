const ACTIONS = {
  conditional: (props, flowControl) => {
    if (flowControl !== 'start') {
      return { props: {}, controlFlowIndex: 1 };
    }

    if (Math.random() < 0.5) {
      return {
        props: {},
        controlFlowIndex: 0
      }
    }

    return {
      props: {},
      controlFlowIndex: 1
    }
  },
  repeat_times: ({ currentIndex = 0, count = 0 }, flowControl) => {
    console.log('repeat_times ->', currentIndex, count);

    if (flowControl === 'start') {
      return {
        props: {
          currentIndex: 0
        },
        controlFlowIndex: 0
      }
    }

    if (flowControl === 'end' && currentIndex < count - 1) {
      return {
        props: {
          currentIndex: currentIndex + 1
        },
        controlFlowIndex: 0
      }
    }

    if (flowControl === 'end') {
      return {
        props: {},
        controlFlowIndex: 1
      }
    }
  },
  log: ({ message = ''}) => {
    console.log('log ->', message);
    return {
      props: {}
    }
  }
}

export default ACTIONS;
