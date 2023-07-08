import * as React from 'react'
import { createRoot } from 'react-dom/client';

import socket from './utils/socket'
socket.init();

import ChatWindow from './comps/Chat/ChatWindow';
import Menu from './comps/Menu'
import CodeEditor from './comps/CodeEditor/CodeEditor';
import CodeRunWindow from './comps/CodeRunner/CodeRunWindow';


class App extends React.Component {
  constructor() {
    super();

    this.state = {
      connected: false,
      showApp: false,
      userlist: [],
      activeChannel: 'main',
      chatWidth: 300
    }

    this.actionBtns = [{

    }];

  }

  componentDidMount() {
    
    socket.init({
      getActiveChannel: () => this.state.activeChannel,
    })
      .then(() => {
        socket.on('userlist', (userlist) => {
          this.setState({userlist: userlist})
        });

        socket.on('userJoin', (user) => {
          const userlist = [...this.state.userlist];
          userlist.push(user);
    
          this.setState({userlist})
        });

        socket.on('userLeft', (user) => {
          const userlist = [...this.state.userlist];
          const index = userlist.findIndex(a=> a.id == user.id);
    
          if (index !== -1) { 
            userlist.splice(index, 1);
            this.setState({userlist})
          }
        });

        socket.on('userStateChange', ({user, stateChange}) => {
          const userlist = [...this.state.userlist];
          const index = userlist.findIndex(a=> a.id == user.id);

          if (index !== -1) {
            userlist[index] = {...userlist[index], ...stateChange};
            this.setState({userlist})
          }
        });

        socket.emit('joinChannel');

        this.resizeBarRef = React.createRef();

        this.setState({connected: true}, this.scrollListenerInit.bind(this));
      })
  }

  scrollListenerInit() {
    this.draggingWindow = false;

    this.resizeBarRef.current.addEventListener('mousedown', (e) => {
      e.preventDefault();

      this.draggingWindow = true;

      console.log('mousedown', (window.innerWidth - e.clientX) - 170, e.target.offsetLeft);

      // document.addEventListener('mousemove', this.resizePanel);
      // document.addEventListener('mouseup', this.stopResize);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.draggingWindow) {
        this.setState({chatWidth: (window.innerWidth - e.clientX) - 170})
      }
    });

    document.addEventListener('mouseup', (e) => {
      this.draggingWindow = false;
    });

  }

  render() {
    return this.state.connected ? (
      
      <div style={{flexDirection: 'column', display: 'flex', flex: 1, overflow:'hidden'}}>

        <div id='main-container'>

          <div className="chatHeader">
            <div className="appViewToggle" onClick={()=> this.setState({showApp: !this.state.showApp})}>
              <span className="material-symbols-outlined">code</span>
            </div>
          </div>
          {
            this.state.showApp ? <CodeEditor 
              socket={socket}
            /> : null
          }
          
          <div style={{
            display: 'flex',flexDirection: 'row', 
            flex:this.state.showApp ? 'unset' : 1,
            width: this.state.showApp ? (this.state.chatWidth + 'px') : 'unset',
          }}>

            {/* <CodeRunWindow 
              socket={socket}
              userlist={this.state.userlist}
            /> */}

            <div className='resizeBar'>
              <div className='resizeHandle' ref={this.resizeBarRef}></div>
            </div>

            <ChatWindow 
              socket={socket}
              userlist={this.state.userlist}
              toggleEditor={() => this.setState({showApp: !this.state.showApp})}
              editorShown={this.state.showApp}
            />
          </div>
          <Menu 
            userlist={this.state.userlist}
          />

        </div>
      
      </div>
    ) : 'connecting';
  }

}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
