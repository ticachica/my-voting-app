import Link from 'next/link'
import React from 'react'
import fetch from 'unfetch'
import Page from '../components/page'
import Layout from '../components/layout'
import { ListGroup, ListGroupItem } from 'reactstrap';

export default class extends Page {
 /* eslint no-undefined: "error" */
 static async getInitialProps({req}) {
  // Inherit standard props from the Page (i.e. with session data)
  let props = await super.getInitialProps({req})

  // If running on server, perform Async call
  if (typeof window === 'undefined') {
    try {
      props.polls = await this.getPolls()
    } catch (e) {
      props.error = "Unable to fetch Polls on server"
    }
  }
  props.navmenu = false

  return props
}

// Set polls on page load (only if prop is populated, i.e. running on server)
constructor(props) {
  super(props)
  this.state = {
    polls: props.polls || null,
    error: props.error || null
  }
}

// This is called after rendering, only on the client (not the server)
// This allows us to render the page on the client without delaying rendering,
// then load the data fetched via an async call in when we have it.
async componentDidMount() {
  // Only render polls client side if they are not populate (if the page was 
  // rendered on the server, the state will be inherited from the server 
  // render by the client)
  if (this.state.polls === null) {
    try {
      this.setState({
        polls: null,
        error: null
      })
    } catch (e) {
      this.setState({
        error: "Unable to fetch polls on client"
      })
    }
  }
  this.getPolls();
}

getPolls() {
  fetch('/polls', {
    method: 'GET', 
    headers: { 'Content-Type' : 'applicaton/json' }
  })
  .then(r => r.json())
  .then(polls => {
    if (!polls) return
    this.setState({
      polls: polls
    })
  })
}
  render() {
    return (
      <Layout session={this.props.session} navmenu={this.props.navmenu}>
        <h1>Voting App</h1>
        <p> Below are polls created on <i>my voting app</i></p> 
        <RenderPolls polls={this.state.polls} error={this.state.error}/>
     </Layout>
    )
  }

}

export class RenderPolls extends React.Component {
  render() {
    if (this.props.error) {
      // Display error if Polls have fialed to load
      return <p><strong>Error loading Polls:</strong> {this.props.error}</p>
    } else if (!this.props.polls) {
      // Display place holder if Polls are still loading (and no error)
      return <p><i>Loading content…</i></p>
    } else {
      // Display Polls
      return (
      <div>
        {
          this.props.polls.map((poll, i) => (
            <div key={i}>
                <Link as={`/polls/${poll.code}`} href={`/details?code=${poll.code}`} >
                  <a>{poll.title}</a>
                </Link>
            </div>
          ))
        }
      </div>
      )
    }
  }
}