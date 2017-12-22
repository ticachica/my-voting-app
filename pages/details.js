import Link from 'next/link'
import React from 'react'
import fetch from 'unfetch'
import Page from '../components/page'
import Layout from '../components/layout'
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'


export default class extends Page {
    /* eslint no-undefined: "error" */
    static async getInitialProps({req, query: {code} }) { // Inherit standard props from the Page (i.e. with session data)
        let props = await super.getInitialProps({req})
        props.code = code

          // If running on server, perform Async call
        if (typeof window === 'undefined') {
            try {
                props.poll = await this.getPoll(code)
            } catch (e) {
                props.error = "Unable to fetch Polls on server"
            }
        }
        return props
    }

    // Set polls on page load (only if prop is populated, i.e. running on server)
constructor(props) {
    super(props)
    this.state = {
      poll: props.poll || null,
      code: props.code || null,
      error: props.error || null,
    }
  }

  async componentDidMount() {
    // Only render polls client side if they are not populate (if the page was 
    // rendered on the server, the state will be inherited from the server 
    // render by the client)
    if (this.state.poll === null) {
      try {
        this.setState({
          poll: null,
          code: null,
          error: null
        })
      } catch (e) {
        this.setState({
          error: "Unable to fetch polls on client"
        })
      }
    }
    this.getPoll(this.state.code);
  }

  getPoll(code) { fetch('/api/polls/'+code, {
      method: 'GET', 
      headers: { 'Content-Type' : 'applicaton/json' },
    })
    .then(r => r.json())
    .then(poll => {
      //TODO: Set the poll state with poll json
      if (!poll) return
      this.setState({
        poll: poll
      })
    })
}
    render() {
        if (this.state.error) {
            return <p><strong>Error loading Polls:</strong> {this.state.error}</p>
        } else if (!this.state.poll) {
            // Display place holder if Polls are still loading (and no error)
            return <p><i>Loading content…</i></p>
        } else {
            return (
            <div>
               <h2>Poll Title:</h2> 
               <p>{this.state.poll.title}</p>
               <p><b>Voting Options</b></p>
               <RenderVotingOptions poll={this.state.poll} />
           </div>
            )
        }
    }
}

export class RenderVotingOptions extends React.Component {
    render() {
       // Display options
        return <select>
          {
            this.props.poll.options.map((option, i) => (
              <option key={i} value="{option.name}">
                 {option.name}
              </option>
            ))
          }
        </select>
      }
    }