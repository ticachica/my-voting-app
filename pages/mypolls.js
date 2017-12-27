import Link from 'next/link'
import React from 'react'
import fetch from 'unfetch'
import Page from '../components/page'
import Layout from '../components/layout'
import { ListGroup, ListGroupItem } from 'reactstrap';
import Session from '../components/session'
import Cookies from '../components/cookies'

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
    session: props.session,
    polls: props.polls || null,
    error: props.error || null
  }

  if (props.session.user) {
    this.state.name = props.session.user.name
    this.state.email = props.session.user.email
    this.state._createdBy = props.session.user.id
  }
}

// This is called after rendering, only on the client (not the server)
// This allows us to render the page on the client without delaying rendering,
// then load the data fetched via an async call in when we have it.
async componentDidMount() {
  const session = await Session.getSession({force: true})
  this.setState({
    session: session
  })
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

  // If the user bounces off to link/unlink their account we want them to
  // land back here after signing in with the other service / unlinking.
  Cookies.save('redirect_url', '/mypolls')
  this.getMyPolls();
}

getMyPolls() {
  fetch('/api/mypolls', {
    credentials: 'include',
    method: 'GET', 
    headers: { 'Content-Type' : 'applicaton/json' }
  })
  .then(r => r.json())
  .then(polls => {
    if (!polls) {
      console.log("empty")
      return
    }
    console.log(polls)
    this.setState({
      polls: polls
    })
  })
}

render() {
  return (
    <Layout session={this.props.session} navmenu={this.props.navmenu}>
      <h1>Voting App</h1>
      <p> Below are your polls</p> 
      <RenderMyPolls polls={this.state.polls} error={this.state.error}/> 
   </Layout>
  )
}
}

export class RenderMyPolls extends React.Component {
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