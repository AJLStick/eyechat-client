import * as React from 'react'
import { createRoot } from 'react-dom/client';

import Store from './utils/store';
import socket from './utils/socket'

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
      chatWidth: 800,
      userID: null,
      focusOn: 'chat',
      plugins: [],

      //chat states
      messages: [],
    }

    this.getMyNick = this.getMyNick.bind(this)
  }

  _initChatEvents (socket) {

    

  }

  componentDidMount() {
    socket.init({
      getActiveChannel: () => this.state.activeChannel,
    })
      .then(() => {
        this.store = new Store();

        socket.on('pong', () => {

          socket.emit('ping');

        });

        socket.on('userlist', (userlist) => {
          this.setState({ userlist: userlist })
        });

        socket.on('setID', (ID) => {
          this.setState({ userID: ID })
        })

        socket.on('userJoin', (user) => {
          const userlist = [...this.state.userlist];
          userlist.push(user);

          this.setState({ userlist })
        });

        socket.on('userLeft', (user) => {
          const userlist = [...this.state.userlist];
          const index = userlist.findIndex(a => a.id == user.id);
     
          if (index !== -1) {
            userlist.splice(index, 1);
            this.setState({ userlist })
          }
        });

        socket.on('userStateChange', ({ user, stateChange }) => {
          const userlist = [...this.state.userlist];
          const index = userlist.findIndex(a => a.id == user.id);

          if (index !== -1) {
            userlist[index] = { ...userlist[index], ...stateChange };
            this.setState({ userlist })
          }
        });

        socket.on('channelInfo', (channelInfo) => {
          this.store.handleStates(channelInfo);
          console.log(this.store);
        });

        socket.emit('joinChannel');

        this._initChatEvents(socket);

        this.resizeBarRef = React.createRef();

        this.setState({ connected: true }, this.scrollListenerInit.bind(this));

        const copeCloud = 'http://mentalmeat.cloud:8080/'

        fetch(copeCloud + 'getApps')
          .then(res => res.json())
          .then(res => {
            console.log(res);

            this.setState({ plugins: Object.keys(res) })

          })

      })
  }

  scrollListenerInit() {
    this.resizeBarRef.current.addEventListener('mousedown', (e) => {
      e.preventDefault();

      this.setState({draggingWindow: true});
    });

    document.addEventListener('mousemove', (e) => {
      if (this.state.draggingWindow) {
        this.setState({ chatWidth: (window.innerWidth - e.clientX) });
      }
    });

    document.addEventListener('mouseup', (e) => {

      this.setState({draggingWindow: false});
    });

  }

  getMyNick() {
    const user = this.state.userlist.find((user) => user.id === this.state.userID);

    return user?.nick;
  }

  render() {
    return this.state.connected ? (

      <div style={{ flexDirection: 'column', display: 'flex', flex: 1, overflow: 'hidden' }}>

        <div id='main-container'>

          <div className="sideBar">
            <div className="appViewToggle" onClick={() => this.setState({ showApp: !this.state.showApp })}>
              <span className="material-symbols-outlined">code</span>
            </div>

            <div className='pluginSelectionContainer'>
              {
                this.state.plugins.map((plugin) => (
                  <div key={plugin} className="pluginSelect" onClick={() => {
                    this.setState({ showApp: plugin })
                  }}>
                    {plugin.slice(0,2) + plugin.slice(-2)}
                  </div>
                ))
              }
            </div>

          </div>
          {/* {
            this.state.showApp ? <CodeEditor
              socket={socket}
              refreshIframe={this.refreshIframe}
              setPlugin={(pluginName) => this.setState({pluginName})}
            /> : null
          } */}


          {
            this.state.showApp ? <CodeRunWindow 
              socket={socket}
              userlist={this.state.userlist}
              giveRefresh={(refresh) => this.refreshIframe = refresh}
              focusOnCode={this.state.focusOn == 'code'}
              draggingWindow={this.state.draggingWindow}
              pluginName={this.state.showApp}
            /> : null
          }

          <div style={{
            display: 'flex', flexDirection: 'column',
            flex: this.state.showApp ? 'unset' : 1,
            width: this.state.showApp ? (this.state.chatWidth + 'px') : 'unset',
            overflowX: 'hidden'
          }}>

            <div className='resizeBar'>
              <div className='resizeHandle' ref={this.resizeBarRef}></div>
            </div>

            
              <ChatWindow
                socket={socket}
                userlist={this.state.userlist}
                conversationList={this.state.conversationList}
                channelName={this.state.activeChannel}
                toggleEditor={() => this.setState({ showApp: !this.state.showApp })}
                editorShown={this.state.showApp}
                getMyNick={this.getMyNick}
                focusOnChat={this.state.focusOn == 'chat'}
              /> 
                          
          </div>
        </div>

      </div>
    ) : 'connecting';
  }

}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
