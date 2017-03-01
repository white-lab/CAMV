import React  from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader';

import ViewBox from './ui/ViewBox'

const render = () => {
  ReactDOM.render(
    <AppContainer><ViewBox/></AppContainer>,
    document.getElementById('root')
  );
}

render();
if (module.hot) { module.hot.accept(render); }
