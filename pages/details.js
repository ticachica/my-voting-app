import Link from 'next/link'
import React from 'react'
import fetch from 'unfetch'
import Page from '../components/page'
import Layout from '../components/layout'
import Session from '../components/session'
import { Form, FormGroup, Button, Label, Input  } from 'reactstrap'


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
        //props.session = await Session.getSession({force: true, req: req})
        props.navmenu = false

        return props
    }

    // Set polls on page load (only if prop is populated, i.e. running on server)
constructor(props) {
    super(props)
    this.state = {
      session: props.session,  
      isSignedIn: (props.session.user) ? true : false,
      poll: props.poll || null,
      code: props.code || null,
      error: props.error || null,
      vote: ' '
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
        poll: poll,
        vote: poll.options[0].name
      })
    })
}

handleChange(event) {
    this.setState({
        vote: event.target.value
    });
  }

async handleSubmit(event) {
    // Submits the URL encoded form without causing a page reload
    event.preventDefault()
    const poll = this.state.poll;
    const option = poll.options.find((option) => { return option.name === this.state.vote; });
    const voteCount = Number(option.vote) + 1
    console.log("votes: "+voteCount)
    
    const formData = {
        _csrf: await Session.getCsrfToken(),
        code: this.state.poll.code,
        id: option._id,
        voteCount : voteCount
    }

    // URL encode form
    // Note: This uses a x-www-form-urlencoded rather than sending JSON so that
    // the form also in browsers without JavaScript
    const encodedForm = Object.keys(formData).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
      }).join('&')

      fetch('/vote', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: encodedForm
      })
      .then(async res => {
        if (res.status === 200) {
            // Make sure to get the updated poll after voting
            this.getPoll(this.state.poll.code)
            alert('Your vote is: ' + this.state.vote);          
        } else {
            alert('Your vote failed!');         
        }
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
            <Layout session={this.props.session} navmenu={this.props.navmenu}>
            <div>
               <h2>Poll Title:</h2> 
               <h3>{this.state.poll.title}</h3>
               <br />
               <Form onSubmit={this.handleSubmit}>
                  <FormGroup>
                    <Label for="Voting"><b>Voting Options</b></Label>
                    <Input name="code" type="hidden" value={this.state.poll.code} onChange={()=>{}}/> 
                    <Input name="_csrf" type="hidden" value={this.state.session.csrfToken} onChange={()=>{}}/>
                    <Input type="select" name="select" id="VotingSelect" value={this.state.vote} onChange={this.handleChange}>
                    {
                     this.state.poll.options.map((option, i) => (
                         <option key={i} value={option.name}>
                             {option.name}
                         </option>
                      ))
                    }
                    </Input>
                  </FormGroup>
                <Button color="secondary" type="submit">Submit Vote</Button>
               </Form>
           </div>
           </Layout>
            )
        }
    }
}