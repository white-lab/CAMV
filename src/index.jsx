import React  from 'react'
import ReactDOM from 'react-dom'

import ViewBox from './ui/ViewBox'

var app = (<ViewBox />)

if (process.env.NODE_ENV === 'development') {
  const { AppContainer } = require('react-hot-loader')

  app = (
    <AppContainer>{app}</AppContainer>
  )
}

const render = () => {
  ReactDOM.render(
    app,
    document.getElementById('root')
  )
}

render()

if (module.hot) { module.hot.accept(render) }
